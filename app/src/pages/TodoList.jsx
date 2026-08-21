import Layout from '../components/Layout'
import TargetTodo from '../components/TargetTodo'
import { motion } from 'framer-motion'
import './TodoList.css'

export default function TodoList() {
  return (
    <Layout>
      <motion.div
        className="todo-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="page-header">
          <div className="page-header-left">
            <h1>Todo List</h1>
            <p>Kelola tugas harian kamu</p>
          </div>
        </div>

        <TargetTodo />
      </motion.div>
    </Layout>
  )
}
