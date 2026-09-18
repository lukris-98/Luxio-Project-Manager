# =====================================================================
# deploy-luxio.ps1 - Luxio Deploy Panel (GUI WinForms)
# =====================================================================
# Panel deploy all-in-one:
#   1. Frontend  : build Vite -> deploy Firebase Hosting +/ EdgeOne Pages
#   2. Backend   : git commit & push ke GitHub (master)
#   3. HF Space  : bump CACHE_BUST -> commit & push -> auto-rebuild
#
# Jalankan: double-click Deploy-Luxio.bat (folder yang sama).
# =====================================================================

$ErrorActionPreference = 'Continue'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

# ---------- Path proyek ----------
$scriptRoot = Split-Path -Parent $PSScriptRoot          # root repo
$appDir     = Join-Path $scriptRoot 'app'
$hfDir      = Join-Path $scriptRoot 'hf-hf-deploy'
$envFile    = Join-Path $scriptRoot 'backend\.env'
$dockerfile = Join-Path $hfDir 'Dockerfile'

# ---------- State ----------
$script:busy = $false

# ---------- Fungsi util ----------
function Get-HfToken {
    param([string]$Override)
    if ($Override -and $Override.Trim()) { return $Override.Trim() }
    if (Test-Path -LiteralPath $envFile) {
        $m = Select-String -LiteralPath $envFile -Pattern '^HF_TOKEN=(.+)$' | Select-Object -First 1
        if ($m) { return $m.Matches[0].Groups[1].Value.Trim() }
    }
    return ''
}

function Log {
    param([string]$Text, [switch]$Err)
    $color = 'DarkGray'
    if ($Err) { $color = 'Firebrick' }
    $logBox.SelectionStart = $logBox.TextLength
    $logBox.SelectionLength = 0
    $logBox.SelectionColor = $color
    $logBox.AppendText("$Text`r`n")
    $logBox.SelectionColor = $logBox.ForeColor
    $logBox.ScrollToCaret()
    [System.Windows.Forms.Application]::DoEvents()
}

function Run-Cmd {
    param([string]$Cmd, [string]$WorkDir, [string]$MaskToken)
    Log ">> [$WorkDir] $Cmd"
    try {
        Push-Location -LiteralPath $WorkDir
        $out = & cmd.exe /c "$Cmd 2>&1" | Out-String
        if ($MaskToken -and $out) { $out = $out.Replace($MaskToken, 'hf_***') }
        if ($out.Trim()) { Log $out.TrimEnd() }
        $code = $LASTEXITCODE
        Pop-Location
        if ($code -ne 0) { Log "  exit code: $code" -Err; return $false }
        return $true
    } catch {
        Log "  ERROR: $($_.Exception.Message)" -Err
        if ((Get-Location).Path -like "$WorkDir*") { Pop-Location }
        return $false
    }
}

function Bump-CacheBust {
    param([string]$Manual)
    if (-not (Test-Path -LiteralPath $dockerfile)) { Log 'Dockerfile tidak ditemukan.' -Err; return $false }
    $raw = Get-Content -LiteralPath $dockerfile -Raw
    $m = [regex]::Match($raw, 'ARG CACHE_BUST=(\d+)')
    if (-not $m.Success) { Log 'ARG CACHE_BUST tidak ada di Dockerfile.' -Err; return $false }
    $old = [int]$m.Groups[1].Value
    $new = $old + 1
    if ($Manual -and $Manual.Trim()) {
        try { $new = [int]$Manual.Trim() } catch { Log "Nilai CACHE_BUST manual tidak valid: $Manual" -Err; return $false }
    }
    $raw2 = $raw -replace 'ARG CACHE_BUST=\d+', "ARG CACHE_BUST=$new"
    Set-Content -LiteralPath $dockerfile -Value $raw2 -NoNewline -Encoding ASCII
    Log "CACHE_BUST: $old -> $new"
    return $true
}

# =====================================================================
# GUI
# =====================================================================
$form              = New-Object System.Windows.Forms.Form
$form.Text         = 'Luxio Deploy Panel'
$form.Size         = New-Object System.Drawing.Size(760, 760)
$form.StartPosition= 'CenterScreen'
$form.Font         = New-Object System.Drawing.Font('Segoe UI', 9)

# ---------- Section: Frontend ----------
$gFront = New-Object System.Windows.Forms.GroupBox
$gFront.Text = '1. Frontend (app/)'
$gFront.Location = New-Object System.Drawing.Point(12, 12)
$gFront.Size = New-Object System.Drawing.Size(720, 190)

$cbBuild = New-Object System.Windows.Forms.CheckBox
$cbBuild.Text = 'Build frontend (npm run build, bersihkan dist dulu)'
$cbBuild.Location = New-Object System.Drawing.Point(14, 24)
$cbBuild.Size = New-Object System.Drawing.Size(480, 22)
$cbBuild.Checked = $true
$gFront.Controls.Add($cbBuild)

$cbFirebase = New-Object System.Windows.Forms.CheckBox
$cbFirebase.Text = 'Deploy Firebase Hosting (luxio-id -> firebase.json)'
$cbFirebase.Location = New-Object System.Drawing.Point(14, 50)
$cbFirebase.Size = New-Object System.Drawing.Size(480, 22)
$cbFirebase.Checked = $true
$gFront.Controls.Add($cbFirebase)

$cbEdgeone = New-Object System.Windows.Forms.CheckBox
$cbEdgeone.Text = 'Deploy EdgeOne Pages (jalankan command di bawah)'
$cbEdgeone.Location = New-Object System.Drawing.Point(14, 76)
$cbEdgeone.Size = New-Object System.Drawing.Size(480, 22)
$cbEdgeone.Checked = $false
$gFront.Controls.Add($cbEdgeone)

$lblEo = New-Object System.Windows.Forms.Label
$lblEo.Text = 'Command EdgeOne:'
$lblEo.Location = New-Object System.Drawing.Point(14, 106)
$lblEo.Size = New-Object System.Drawing.Size(130, 20)
$gFront.Controls.Add($lblEo)

$txEoCmd = New-Object System.Windows.Forms.TextBox
$txEoCmd.Text = 'npx edgeone pages deploy'
$txEoCmd.Location = New-Object System.Drawing.Point(150, 103)
$txEoCmd.Size = New-Object System.Drawing.Size(556, 23)
$gFront.Controls.Add($txEoCmd)

$lblEoHint = New-Object System.Windows.Forms.Label
$lblEoHint.Text = 'Login sekali dulu di terminal: npx edgeone pages login  |  workdir: app/'
$lblEoHint.Location = New-Object System.Drawing.Point(14, 132)
$lblEoHint.Size = New-Object System.Drawing.Size(690, 20)
$lblEoHint.ForeColor = 'Gray'
$gFront.Controls.Add($lblEoHint)

$lblEoHint2 = New-Object System.Windows.Forms.Label
$lblEoHint2.Text = 'Site Firebase: luxio-id.web.app / luxio.web.id  |  EdgeOne: sesuai project yang di-link.'
$lblEoHint2.Location = New-Object System.Drawing.Point(14, 152)
$lblEoHint2.Size = New-Object System.Drawing.Size(690, 20)
$lblEoHint2.ForeColor = 'Gray'
$gFront.Controls.Add($lblEoHint2)

$form.Controls.Add($gFront)

# ---------- Section: Backend GitHub ----------
$gGit = New-Object System.Windows.Forms.GroupBox
$gGit.Text = '2. Backend + kode -> GitHub (master)'
$gGit.Location = New-Object System.Drawing.Point(12, 210)
$gGit.Size = New-Object System.Drawing.Size(720, 110)

$cbGit = New-Object System.Windows.Forms.CheckBox
$cbGit.Text = 'Commit & push ke GitHub origin/master'
$cbGit.Location = New-Object System.Drawing.Point(14, 24)
$cbGit.Size = New-Object System.Drawing.Size(480, 22)
$cbGit.Checked = $true
$gGit.Controls.Add($cbGit)

$cbAddAll = New-Object System.Windows.Forms.CheckBox
$cbAddAll.Text = 'git add -A (semua perubahan)'
$cbAddAll.Location = New-Object System.Drawing.Point(14, 50)
$cbAddAll.Size = New-Object System.Drawing.Size(200, 22)
$cbAddAll.Checked = $true
$gGit.Controls.Add($cbAddAll)

$cbAddSrc = New-Object System.Windows.Forms.CheckBox
$cbAddSrc.Text = 'hanya backend/src + app/src'
$cbAddSrc.Location = New-Object System.Drawing.Point(220, 50)
$cbAddSrc.Size = New-Object System.Drawing.Size(220, 22)
$gGit.Controls.Add($cbAddSrc)

$lblMsg = New-Object System.Windows.Forms.Label
$lblMsg.Text = 'Pesan commit:'
$lblMsg.Location = New-Object System.Drawing.Point(14, 78)
$lblMsg.Size = New-Object System.Drawing.Size(95, 20)
$gGit.Controls.Add($lblMsg)

$txMsg = New-Object System.Windows.Forms.TextBox
$txMsg.Text = 'update'
$txMsg.Location = New-Object System.Drawing.Point(115, 75)
$txMsg.Size = New-Object System.Drawing.Size(591, 23)
$gGit.Controls.Add($txMsg)

$form.Controls.Add($gGit)

# ---------- Section: HF Space ----------
$gHf = New-Object System.Windows.Forms.GroupBox
$gHf.Text = '3. Hugging Face Space (rebuild backend)'
$gHf.Location = New-Object System.Drawing.Point(12, 328)
$gHf.Size = New-Object System.Drawing.Size(720, 130)

$cbHf = New-Object System.Windows.Forms.CheckBox
$cbHf.Text = 'Bump CACHE_BUST + commit + push ke Space (auto-rebuild)'
$cbHf.Location = New-Object System.Drawing.Point(14, 24)
$cbHf.Size = New-Object System.Drawing.Size(480, 22)
$cbHf.Checked = $true
$gHf.Controls.Add($cbHf)

$lblBust = New-Object System.Windows.Forms.Label
$lblBust.Text = 'CACHE_BUST (kosong = +1):'
$lblBust.Location = New-Object System.Drawing.Point(14, 53)
$lblBust.Size = New-Object System.Drawing.Size(160, 20)
$gHf.Controls.Add($lblBust)

$txBust = New-Object System.Windows.Forms.TextBox
$txBust.Location = New-Object System.Drawing.Point(180, 50)
$txBust.Size = New-Object System.Drawing.Size(80, 23)
$gHf.Controls.Add($txBust)

$lblSpace = New-Object System.Windows.Forms.Label
$lblSpace.Text = 'Space:'
$lblSpace.Location = New-Object System.Drawing.Point(280, 53)
$lblSpace.Size = New-Object System.Drawing.Size(50, 20)
$gHf.Controls.Add($lblSpace)

$txSpace = New-Object System.Windows.Forms.TextBox
$txSpace.Text = 'lukris/n8n'
$txSpace.Location = New-Object System.Drawing.Point(330, 50)
$txSpace.Size = New-Object System.Drawing.Size(140, 23)
$gHf.Controls.Add($txSpace)

$lblTok = New-Object System.Windows.Forms.Label
$lblTok.Text = 'HF token (kosong = baca backend/.env):'
$lblTok.Location = New-Object System.Drawing.Point(14, 82)
$lblTok.Size = New-Object System.Drawing.Size(230, 20)
$gHf.Controls.Add($lblTok)

$txTok = New-Object System.Windows.Forms.TextBox
$txTok.UseSystemPasswordChar = $true
$txTok.Location = New-Object System.Drawing.Point(248, 79)
$txTok.Size = New-Object System.Drawing.Size(240, 23)
$gHf.Controls.Add($txTok)

$btnStatus = New-Object System.Windows.Forms.Button
$btnStatus.Text = 'Status Space'
$btnStatus.Location = New-Object System.Drawing.Point(505, 77)
$btnStatus.Size = New-Object System.Drawing.Size(100, 27)
$gHf.Controls.Add($btnStatus)

$btnRestart = New-Object System.Windows.Forms.Button
$btnRestart.Text = 'Restart'
$btnRestart.Location = New-Object System.Drawing.Point(610, 77)
$btnRestart.Size = New-Object System.Drawing.Size(90, 27)
$gHf.Controls.Add($btnRestart)

$form.Controls.Add($gHf)

# ---------- Section: opsi ----------
$gOpt = New-Object System.Windows.Forms.GroupBox
$gOpt.Text = 'Opsi'
$gOpt.Location = New-Object System.Drawing.Point(12, 466)
$gOpt.Size = New-Object System.Drawing.Size(720, 56)

$cbStop = New-Object System.Windows.Forms.CheckBox
$cbStop.Text = 'Berhenti saat langkah gagal'
$cbStop.Location = New-Object System.Drawing.Point(14, 24)
$cbStop.Size = New-Object System.Drawing.Size(260, 22)
$cbStop.Checked = $true
$gOpt.Controls.Add($cbStop)

$form.Controls.Add($gOpt)

# ---------- Tombol utama ----------
$btnGo = New-Object System.Windows.Forms.Button
$btnGo.Text = 'MULAI DEPLOY'
$btnGo.Location = New-Object System.Drawing.Point(12, 530)
$btnGo.Size = New-Object System.Drawing.Size(200, 38)
$btnGo.BackColor = 'SteelBlue'
$btnGo.ForeColor = 'White'
$btnGo.FlatStyle = 'Flat'
$form.Controls.Add($btnGo)

$logBox = New-Object System.Windows.Forms.TextBox
$logBox.Multiline = $true
$logBox.ReadOnly = $true
$logBox.ScrollBars = 'Vertical'
$logBox.Font = New-Object System.Drawing.Font('Consolas', 8.5)
$logBox.Location = New-Object System.Drawing.Point(12, 576)
$logBox.Size = New-Object System.Drawing.Size(720, 140)
$form.Controls.Add($logBox)

# ---------- Actions ----------
$btnStatus.Add_Click({
    $t = Get-HfToken $txTok.Text
    if (-not $t) { Log 'HF token tidak ada (isi field atau backend/.env).' -Err; return }
    try {
        $r = Invoke-RestMethod -Uri "https://huggingface.co/api/spaces/$($txSpace.Text)" -Headers @{ Authorization = "Bearer $t" } -TimeoutSec 20
        Log "Space $($txSpace.Text): stage = $($r.runtime.stage)"
    } catch { Log "Gagal cek status: $($_.Exception.Message)" -Err }
})

$btnRestart.Add_Click({
    $t = Get-HfToken $txTok.Text
    if (-not $t) { Log 'HF token tidak ada.' -Err; return }
    try {
        Invoke-RestMethod -Method Post -Uri "https://huggingface.co/api/spaces/$($txSpace.Text)/restart" -Headers @{ Authorization = "Bearer $t" } -TimeoutSec 20 | Out-Null
        Log 'Restart Space dikirim.'
    } catch { Log "Gagal restart: $($_.Exception.Message)" -Err }
})

$btnGo.Add_Click({
    if ($script:busy) { return }
    $script:busy = $true
    $btnGo.Enabled = $false
    $stop = $cbStop.Checked
    $okAll = $true

    Log ('===== DEPLOY MULAI ' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + ' =====')

    # 1. Build frontend
    if ($cbBuild.Checked) {
        if (Test-Path (Join-Path $appDir 'dist')) {
            try { Remove-Item -LiteralPath (Join-Path $appDir 'dist') -Recurse -Force -ErrorAction Stop; Log 'dist dibersihkan.' } catch { Log "Gagal bersihkan dist: $($_.Exception.Message)" -Err }
        }
        if (-not (Run-Cmd 'npm run build' $appDir)) { $okAll = $false; if ($stop) { Log 'BERHENTI di build.' -Err; $script:busy = $false; $btnGo.Enabled = $true; return } }
    }

    # 2. Firebase
    if ($cbFirebase.Checked) {
        if (-not (Run-Cmd 'npx firebase deploy --only hosting --config ../firebase.json' $appDir)) { $okAll = $false; if ($stop) { Log 'BERHENTI di Firebase.' -Err; $script:busy = $false; $btnGo.Enabled = $true; return } }
    }

    # 3. EdgeOne
    if ($cbEdgeone.Checked) {
        $cmd = $txEoCmd.Text.Trim()
        if ($cmd) { if (-not (Run-Cmd $cmd $appDir)) { $okAll = $false; if ($stop) { Log 'BERHENTI di EdgeOne.' -Err; $script:busy = $false; $btnGo.Enabled = $true; return } } }
    }

    # 4. Git push GitHub
    if ($cbGit.Checked) {
        Push-Location -LiteralPath $scriptRoot
        try {
            if ($cbAddAll.Checked) { & git add -A }
            elseif ($cbAddSrc.Checked) { & git add backend/src app/src }
            $staged = (& git diff --cached --name-only | Measure-Object).Count
            if ($staged -gt 0) {
                & git commit -m $txMsg.Text | Out-Null
                Log "Commit dibuat ($staged file): $($txMsg.Text)"
                $out = & git push origin master 2>&1 | Out-String
                Log $out.TrimEnd()
                if ($LASTEXITCODE -ne 0) { $okAll = $false; Log 'Push GitHub gagal.' -Err }
            } else {
                Log 'Tidak ada perubahan untuk di-commit.'
            }
        } finally { Pop-Location }
        if (-not $okAll -and $stop) { Log 'BERHENTI di GitHub push.' -Err; $script:busy = $false; $btnGo.Enabled = $true; return }
    }

    # 5. HF Space
    if ($cbHf.Checked) {
        if (-not (Bump-CacheBust $txBust.Text)) { $okAll = $false; if ($stop) { Log 'BERHENTI di bump CACHE_BUST.' -Err; $script:busy = $false; $btnGo.Enabled = $true; return } }
        $tok = Get-HfToken $txTok.Text
        if (-not $tok) { Log 'HF token tidak ditemukan - push dibatalkan.' -Err; $okAll = $false }
        else {
            Push-Location -LiteralPath $hfDir
            try {
                & git add Dockerfile
                & git commit -m "Bump CACHE_BUST - deploy via panel" | Out-Null
                $b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("lukris:$tok"))
                $out = & git -c credential.helper= -c "http.extraheader=Authorization: Basic $b64" push origin main 2>&1 | Out-String
                Log ($out.Replace($tok, 'hf_***').TrimEnd())
                if ($LASTEXITCODE -ne 0) { $okAll = $false; Log 'Push HF Space gagal.' -Err }
            } finally { Pop-Location }
        }
        if (-not $okAll -and $stop) { Log 'BERHENTI di HF push.' -Err; $script:busy = $false; $btnGo.Enabled = $true; return }
    }

    if ($okAll) { Log '===== SELESAI - SEMUA LANGKAH SUKSES =====' }
    else { Log '===== SELESAI DENGAN ERROR (lihat log) =====' -Err }
    $script:busy = $false
    $btnGo.Enabled = $true
})

Log 'Luxio Deploy Panel siap. Pilih langkah lalu klik MULAI DEPLOY.'
[void]$form.ShowDialog()
