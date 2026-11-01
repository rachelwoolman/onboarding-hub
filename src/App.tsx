import { DemoControls } from './components/DemoControls'
import { TopBar } from './components/TopBar'
import { ChloePage } from './pages/ChloePage'
import { MateoPage } from './pages/MateoPage'
import { useStore } from './state/store'

function App() {
  const { state, resetKey } = useStore()
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      {state.view === 'hire' ? <ChloePage key={resetKey} /> : <MateoPage key={resetKey} />}
      <DemoControls />
    </div>
  )
}

export default App
