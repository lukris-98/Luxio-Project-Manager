# Jobs Overview

Run compute jobs on Hugging Face infrastructure with a familiar UV & Docker-like interface!

UV & Docker-like CLI uv,run,ps,logs,stats,inspect Any Hardware CPUs to A100s &amp; TPUs Run Anything UV, Docker, HF Spaces &amp; more Pay-as-you-go Pay only for seconds used

The Hugging Face Hub provides compute for AI and data workflows via Jobs.

Jobs runs on Hugging Face infrastructure and aim at providing AI builders, Data engineers, developers and AI agents an easy access to cloud infrastructure to run their workloads. They are ideal to fine tune AI models and run inference with GPUs, but also for data ingestion and processing as well.

A job is defined with a command to run (e.g. a UV or python command), a hardware flavor (CPU, GPU, TPU), and optionally a Docker image from Hugging Face Spaces or Docker Hub. Many jobs can run in parallel, which is useful e.g. for parameter tuning or parallel inference and data processing.

## Run Jobs from anywhere

There are multiple tools you can use to run jobs:

* the `hf` Command Line Interface (see the [CLI installation steps](https://huggingface.co/docs/huggingface_hub/main/en/guides/cli) and the [Jobs CLI documentation](https://huggingface.co/docs/huggingface_hub/guides/cli#hf-jobs) for more information)
* the `huggingface_hub` Python client (see the [`huggingface_hub` Jobs documentation](https://huggingface.co/docs/huggingface_hub/guides/jobs) for more information)
* the Jobs HTTP API (see the [Jobs OpenAPI](https://huggingface-openapi.hf.space/#tag/jobs) for more information)

## Run any workload

The `hf` Jobs CLI and the `huggingface_hub` Python client offer a UV-like interface to run Python workloads. UV installs the required Python dependencies and run the Python script in one single command. Python dependencies may also be defined in a self-contained UV script, and in this case there is no need to specify anything but the UV script to run the Job.

```diff
- uv run <script.py>
+ hf jobs uv run <script.py>
```

More generally, Hugging Face Jobs supports any workload based on Docker and a command. Jobs offers a Docker-like interface to rub Jobs, where you can specify a Docker image from Hugging Face Spaces or Docker Hub, as well as the command to run. Docker provides the ability to package ready-to-use environments as Docker images that are shared by the community or custom made. Therefore you may choose or define your Docker image based on what your workloads need (e.g. python, torch, vllm) and run any command. This is more advanced than using UV but provides more flexibility.

```diff
- docker run <image> <command>
+ hf jobs run <image> <command>
```

## Automate Jobs

Trigger Jobs automatically with a schedule or using webhooks.

With a schedule, you can run Jobs every X minutes, hours, days, weeks or months. Scheduling Jobs uses the `cron` syntax like `"*/5 * * * *"` for "every 5 minutes", or aliases like `"@hourly"`, `"@daily"`, `"weekly"` or `"@monthly"`.

With webhooks, Jobs can run whenever there is an update on a Hugging Face repository. For example you can configure webhooks to trigger for every model update under a given account, and retrieve the updated model from the webhook payload in the Job.

