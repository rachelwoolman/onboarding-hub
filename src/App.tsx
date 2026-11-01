import { DemoControls } from './components/DemoControls'
import { TopBar } from './components/TopBar'
import { Plant } from './components/Plant'
import { ChloePage } from './pages/ChloePage'
import { useStore } from './state/store'

function App() {
  const { state, resetKey } = useStore()
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      {state.view === 'hire' ? <ChloePage key={resetKey} /> : <ManagerPlaceholder />}
      <DemoControls />
    </div>
  )
}

/** Mateo's page arrives in step 3. */
function ManagerPlaceholder() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 pt-16 text-center sm:px-8">
      <Plant stage="sprout" className="mx-auto size-24" />
      <h1 className="mt-4 font-serif text-4xl text-ink">Good morning, Mateo</h1>
      <p className="mt-3 text-ink-soft">Your garden is coming in the next step.</p>
    </main>
  )
}

export default App
