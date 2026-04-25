import { ExcelTranslatorPage } from './features/excel/ExcelTranslatorPage';

function App() {
  return (
    <main className="page-shell">
      <div className="page-shell__glow page-shell__glow--left" />
      <div className="page-shell__glow page-shell__glow--right" />

      <ExcelTranslatorPage />
    </main>
  );
}

export default App;
