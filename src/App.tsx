import { useState } from 'react';

import { ExcelTranslatorPage } from './features/excel/ExcelTranslatorPage';
import { GeneratorPage } from './features/generator/GeneratorPage';

type TabId = 'excel' | 'generator';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('excel');

  return (
    <main className="page-shell">
      <div className="page-shell__glow page-shell__glow--left" />
      <div className="page-shell__glow page-shell__glow--right" />

      <div className="tab-switcher" role="tablist" aria-label="功能切换">
        <button
          className={`tab-switcher__item ${activeTab === 'excel' ? 'is-active' : ''}`}
          type="button"
          role="tab"
          aria-selected={activeTab === 'excel'}
          onClick={() => setActiveTab('excel')}
        >
          📄 数据翻译
        </button>
        <button
          className={`tab-switcher__item ${activeTab === 'generator' ? 'is-active' : ''}`}
          type="button"
          role="tab"
          aria-selected={activeTab === 'generator'}
          onClick={() => setActiveTab('generator')}
        >
          🪄 图片生成
        </button>
      </div>

      {activeTab === 'excel' ? <ExcelTranslatorPage /> : <GeneratorPage />}
    </main>
  );
}

export default App;
