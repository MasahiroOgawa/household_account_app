import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction } from '../types/Transaction';
import { calculateBlueReturn, getSortedKamoku, getAvailableYears, getAvailableSources, calculateDepositStart, BlueReturnData } from '../utils/blueReturnCalculator';
import { parsePreviousYearPdf } from '../utils/blueReturnPdfParser';
import { WithholdingTaxData } from '../utils/withholdingTaxPdfParser';
import { FurusatoDonation } from '../utils/furusatoTaxPdfParser';
import { loadTaxFilingState, saveTaxFilingState } from '../utils/taxFilingState';
import { WithholdingTaxSection } from './WithholdingTaxSection';
import { FurusatoSection } from './FurusatoSection';
import { TaxFormB } from './TaxFormB';

interface BlueReturnViewProps {
  transactions: Transaction[];
}

const BLUE_DEDUCTION = 650000;
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const fmt = (n: number) => n.toLocaleString('ja-JP');

const CopyCell: React.FC<{ value: number; className?: string }> = ({ value, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };
  return (
    <td
      className={`px-3 py-1 text-right cursor-pointer hover:bg-blue-50 select-all ${className}`}
      onClick={handleClick}
      title="Click to copy"
    >
      {copied ? <span className="text-blue-600 text-xs">Copied!</span> : fmt(value)}
    </td>
  );
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-lg font-bold mt-6 mb-2 border-b-2 border-black pb-1">{children}</h3>
);

// 家事按分 targets and default ratio
const KAJIANBUN_TARGETS = ['水道光熱費', '通信費', '地代家賃', '修繕積立金'] as const;
interface KajianbunState {
  水道光熱費: number;
  通信費: number;
  地代家賃: number;
  修繕積立金: number;
}

const defaultKajianbun: KajianbunState = {
  水道光熱費: 36,
  通信費: 71,
  地代家賃: 71,
  修繕積立金: 71,
};

// 貸借対照表 editable fields
interface BalanceSheetState {
  cashStart: number;
  depositStart: number;
  accountsReceivableStart: number;
  accountsReceivableEnd: number;
  inventoryStart: number;
  inventoryEnd: number;
  buildingStart: number;
  buildingEnd: number;
  buildingEquipmentStart: number;
  buildingEquipmentEnd: number;
  toolsStart: number;
  toolsEnd: number;
  accountsPayableStart: number;
  accountsPayableEnd: number;
  unpaidStart: number;
  unpaidEnd: number;
  motoirekin: number;
}

const defaultBalanceSheet: BalanceSheetState = {
  cashStart: 0,
  depositStart: 0,
  accountsReceivableStart: 0,
  accountsReceivableEnd: 0,
  inventoryStart: 0,
  inventoryEnd: 0,
  buildingStart: 0,
  buildingEnd: 0,
  buildingEquipmentStart: 0,
  buildingEquipmentEnd: 0,
  toolsStart: 0,
  toolsEnd: 0,
  accountsPayableStart: 0,
  accountsPayableEnd: 0,
  unpaidStart: 0,
  unpaidEnd: 0,
  motoirekin: 0,
};

type SubTab = 'kessan' | 'withholding' | 'furusato' | 'form_b';

export const BlueReturnView: React.FC<BlueReturnViewProps> = ({ transactions }) => {
  const years = useMemo(() => getAvailableYears(transactions), [transactions]);
  const [selectedYear, setSelectedYear] = useState<number>(years[0] || new Date().getFullYear());
  const [bs, setBs] = useState<BalanceSheetState>(defaultBalanceSheet);
  const [kajianbun, setKajianbun] = useState<KajianbunState>(defaultKajianbun);
  const [subTab, setSubTab] = useState<SubTab>('kessan');

  // Tax filing persistent state
  const [withholding, setWithholding] = useState<WithholdingTaxData | null>(null);
  const [furusatoDonations, setFurusatoDonations] = useState<FurusatoDonation[]>([]);
  const [businessSources, setBusinessSources] = useState<string[]>([]);

  const availableSources = useMemo(() => getAvailableSources(transactions), [transactions]);

  // Load persisted state on mount
  useEffect(() => {
    const state = loadTaxFilingState();
    if (state.withholding) setWithholding(state.withholding);
    if (state.furusatoDonations.length > 0) setFurusatoDonations(state.furusatoDonations);
    if (state.businessSources.length > 0) setBusinessSources(state.businessSources);
  }, []);

  // Persist state changes
  useEffect(() => {
    saveTaxFilingState({ withholding, furusatoDonations, businessSources });
  }, [withholding, furusatoDonations, businessSources]);

  // Auto-calculate deposit start from business bank balances (overrides manual/PDF value)
  const autoDepositStart = useMemo(() => {
    if (businessSources.length === 0) return null;
    const val = calculateDepositStart(transactions, selectedYear, businessSources);
    return val > 0 ? val : null;
  }, [businessSources, selectedYear, transactions]);

  // Use auto-calculated value when available, otherwise fall back to manually entered bs.depositStart
  const effectiveDepositStart = autoDepositStart ?? bs.depositStart;

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [pdfError, setPdfError] = useState('');

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfStatus('loading');
    setPdfError('');
    try {
      const prev = await parsePreviousYearPdf(file);
      const newMotoirekin = prev.motoirekin + prev.jigyounushiKari - prev.jigyounushiKashi + prev.shotokuBeforeDeduction;
      setBs(p => ({
        ...p,
        cashStart: prev.cash,
        depositStart: prev.deposit,
        accountsReceivableStart: prev.accountsReceivable,
        inventoryStart: prev.inventory,
        buildingStart: prev.building,
        buildingEquipmentStart: prev.buildingEquipment,
        toolsStart: prev.tools,
        accountsPayableStart: prev.accountsPayable,
        unpaidStart: prev.unpaid,
        motoirekin: newMotoirekin,
      }));
      setPdfStatus('success');
    } catch (err) {
      setPdfStatus('error');
      setPdfError(err instanceof Error ? err.message : 'PDF読み込みに失敗しました');
    }
    e.target.value = '';
  };

  const data: BlueReturnData = useMemo(
    () => calculateBlueReturn(transactions, selectedYear, businessSources),
    [transactions, selectedYear, businessSources]
  );

  // 家事按分: split kamoku between business and private
  const adjusted = useMemo(() => {
    const kamoku = { ...data.kamokuTotals };
    let privateTotal = 0;
    for (const name of KAJIANBUN_TARGETS) {
      const full = kamoku[name] ?? 0;
      if (full === 0) continue;
      const bizPct = kajianbun[name] / 100;
      const bizAmount = Math.round(full * bizPct);
      privateTotal += full - bizAmount;
      kamoku[name] = bizAmount;
    }
    const totalExpenses = Object.values(kamoku).reduce((s, v) => s + v, 0);
    const jigyounushiKashi = data.jigyounushiKashi + privateTotal;
    return { kamoku, totalExpenses, jigyounushiKashi };
  }, [data, kajianbun]);

  const sortedKamoku = useMemo(() => getSortedKamoku(adjusted.kamoku), [adjusted]);
  const profit = data.revenue - adjusted.totalExpenses;
  const income = Math.max(0, profit - BLUE_DEDUCTION);

  // 貸借対照表 期末計算
  const depositEnd = effectiveDepositStart + data.revenue - adjusted.totalExpenses - adjusted.jigyounushiKashi + data.jigyounushiKari;

  const updateBs = (field: keyof BalanceSheetState, value: string) => {
    setBs(prev => ({ ...prev, [field]: Number(value) || 0 }));
  };

  const EditableCell: React.FC<{ field: keyof BalanceSheetState; value: number }> = ({ field, value }) => (
    <td className="px-3 py-1">
      <input
        type="number"
        value={value || ''}
        onChange={e => updateBs(field, e.target.value)}
        className="w-full text-right border border-gray-300 rounded px-2 py-0.5"
      />
    </td>
  );

  const BsRow: React.FC<{
    label: string;
    startField: keyof BalanceSheetState;
    endField?: keyof BalanceSheetState;
    endValue?: number;
    endEditable?: boolean;
  }> = ({ label, startField, endField, endValue, endEditable = true }) => (
    <tr>
      <td className="border border-gray-300 px-3 py-1">{label}</td>
      <EditableCell field={startField} value={bs[startField]} />
      {endEditable && endField ? (
        <EditableCell field={endField} value={bs[endField]} />
      ) : (
        <CopyCell value={endValue ?? bs[startField]} className="border border-gray-300" />
      )}
    </tr>
  );

  const tabClass = (tab: SubTab) =>
    `px-4 py-1.5 text-sm font-medium rounded-t border-t-2 border-x-2 transition-all ${
      subTab === tab
        ? 'bg-white text-black border-black -mb-px z-10 relative'
        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
    }`;

  const toggleSource = (source: string) => {
    setBusinessSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const renderKessanContent = () => (
    <>
      {/* Business bank selection */}
      <SectionTitle>事業用口座の選択</SectionTitle>
      <p className="text-sm text-gray-600 mb-2">事業用の口座を選択してください。選択外の口座の個人取引は事業主貸/借に含まれません。</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {availableSources.map(source => (
          <label key={source} className={`flex items-center gap-1.5 px-3 py-1.5 rounded border-2 cursor-pointer text-sm ${
            businessSources.includes(source)
              ? 'bg-blue-100 border-blue-500 text-blue-800'
              : 'bg-gray-50 border-gray-300 text-gray-600'
          }`}>
            <input
              type="checkbox"
              checked={businessSources.includes(source)}
              onChange={() => toggleSource(source)}
              className="sr-only"
            />
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
              businessSources.includes(source) ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-400'
            }`}>
              {businessSources.includes(source) && '✓'}
            </span>
            {source}
          </label>
        ))}
      </div>
      {businessSources.length === 0 && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800">
          口座が未選択です。すべての取引が事業主貸/借に含まれます。
        </div>
      )}

      {/* Section 1: 損益計算書 */}
      <SectionTitle>損益計算書</SectionTitle>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-1 text-left w-1/2">勘定科目</th>
            <th className="border border-gray-300 px-3 py-1 text-right w-1/2">金額 (円)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-blue-50 font-bold">
            <td className="border border-gray-300 px-3 py-1">売上（収入）金額</td>
            <CopyCell value={data.revenue} className="border border-gray-300 font-bold" />
          </tr>

          {sortedKamoku.map(([name, amount]) => (
            <tr key={name}>
              <td className="border border-gray-300 px-3 py-1 pl-6">{name}</td>
              <CopyCell value={amount} className="border border-gray-300" />
            </tr>
          ))}

          <tr className="bg-gray-50 font-bold">
            <td className="border border-gray-300 px-3 py-1">経費合計</td>
            <CopyCell value={adjusted.totalExpenses} className="border border-gray-300 font-bold" />
          </tr>
          <tr className="font-bold">
            <td className="border border-gray-300 px-3 py-1">差引金額（売上 - 経費）</td>
            <CopyCell value={profit} className="border border-gray-300 font-bold" />
          </tr>
          <tr>
            <td className="border border-gray-300 px-3 py-1">青色申告特別控除額</td>
            <CopyCell value={BLUE_DEDUCTION} className="border border-gray-300" />
          </tr>
          <tr className="bg-yellow-50 font-bold text-lg">
            <td className="border border-gray-300 px-3 py-2">所得金額</td>
            <CopyCell value={income} className="border border-gray-300 font-bold" />
          </tr>
        </tbody>
      </table>

      {/* 家事按分 */}
      <SectionTitle>家事按分</SectionTitle>
      <p className="text-sm text-gray-600 mb-2">事業使用割合（%）を入力してください。残りは事業主貸に振り替えます。</p>
      <table className="w-full border-collapse border border-gray-300 text-sm mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-1 text-left">勘定科目</th>
            <th className="border border-gray-300 px-3 py-1 text-right">按分前</th>
            <th className="border border-gray-300 px-3 py-1 text-center w-28">事業割合 (%)</th>
            <th className="border border-gray-300 px-3 py-1 text-right">経費算入額</th>
            <th className="border border-gray-300 px-3 py-1 text-right">事業主貸</th>
          </tr>
        </thead>
        <tbody>
          {KAJIANBUN_TARGETS.map(name => {
            const full = data.kamokuTotals[name] ?? 0;
            const pct = kajianbun[name];
            const bizAmount = Math.round(full * pct / 100);
            const privateAmount = full - bizAmount;
            return (
              <tr key={name}>
                <td className="border border-gray-300 px-3 py-1">{name}</td>
                <td className="border border-gray-300 px-3 py-1 text-right">{fmt(full)}</td>
                <td className="border border-gray-300 px-1 py-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pct}
                    onChange={e => setKajianbun(prev => ({ ...prev, [name]: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                    className="w-full text-center border border-gray-300 rounded px-2 py-0.5"
                  />
                </td>
                <CopyCell value={bizAmount} className="border border-gray-300" />
                <td className="border border-gray-300 px-3 py-1 text-right text-gray-500">{fmt(privateAmount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Section 2: 月別売上金額 */}
      <SectionTitle>月別売上（収入）金額及び仕入金額</SectionTitle>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-3 py-1 text-left">月</th>
            <th className="border border-gray-300 px-3 py-1 text-right">売上金額</th>
            <th className="border border-gray-300 px-3 py-1 text-right">経費金額</th>
          </tr>
        </thead>
        <tbody>
          {MONTH_LABELS.map((label, i) => (
            <tr key={i}>
              <td className="border border-gray-300 px-3 py-1">{label}</td>
              <CopyCell value={data.monthlyRevenue[i]} className="border border-gray-300" />
              <CopyCell value={data.monthlyExpenses[i]} className="border border-gray-300" />
            </tr>
          ))}
          <tr className="bg-gray-50 font-bold">
            <td className="border border-gray-300 px-3 py-1">合計</td>
            <CopyCell value={data.monthlyRevenue.reduce((s, v) => s + v, 0)} className="border border-gray-300 font-bold" />
            <CopyCell value={data.monthlyExpenses.reduce((s, v) => s + v, 0)} className="border border-gray-300 font-bold" />
          </tr>
        </tbody>
      </table>

      {/* Section 3: 貸借対照表 */}
      <div className="flex items-center justify-between mt-6 mb-2 border-b-2 border-black pb-1">
        <h3 className="text-lg font-bold">貸借対照表（12月31日現在）</h3>
        <div className="flex items-center gap-2">
          <input type="file" accept=".pdf" ref={pdfInputRef} onChange={handlePdfUpload} style={{ display: 'none' }} />
          <button
            onClick={() => pdfInputRef.current?.click()}
            disabled={pdfStatus === 'loading'}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {pdfStatus === 'loading' ? '読込中...' : '前年の決算書PDFを読み込む'}
          </button>
        </div>
      </div>
      {pdfStatus === 'success' && (
        <div className="mb-2 p-2 bg-green-50 border border-green-300 rounded text-sm text-green-800">
          前年の決算書から期首残高と元入金を読み込みました。
        </div>
      )}
      {pdfStatus === 'error' && (
        <div className="mb-2 p-2 bg-red-50 border border-red-300 rounded text-sm text-red-800">
          {pdfError}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {/* 資産の部 */}
        <div>
          <h4 className="font-bold mb-1 text-center bg-gray-100 py-1 border border-gray-300">資産の部</h4>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-1 text-left">科目</th>
                <th className="border border-gray-300 px-3 py-1 text-right">期首</th>
                <th className="border border-gray-300 px-3 py-1 text-right">期末</th>
              </tr>
            </thead>
            <tbody>
              <BsRow label="現金" startField="cashStart" endEditable={false} />
              <tr>
                <td className="border border-gray-300 px-3 py-1">その他の預金</td>
                {autoDepositStart !== null ? (
                  <CopyCell value={effectiveDepositStart} className="border border-gray-300 bg-blue-50" />
                ) : (
                  <EditableCell field="depositStart" value={bs.depositStart} />
                )}
                <CopyCell value={depositEnd} className="border border-gray-300" />
              </tr>
              <BsRow label="売掛金" startField="accountsReceivableStart" endField="accountsReceivableEnd" />
              <BsRow label="棚卸資産" startField="inventoryStart" endField="inventoryEnd" />
              <BsRow label="建物" startField="buildingStart" endField="buildingEnd" />
              <BsRow label="建物附属設備" startField="buildingEquipmentStart" endField="buildingEquipmentEnd" />
              <BsRow label="工具器具備品" startField="toolsStart" endField="toolsEnd" />
            </tbody>
          </table>
        </div>

        {/* 負債・資本の部 */}
        <div>
          <h4 className="font-bold mb-1 text-center bg-gray-100 py-1 border border-gray-300">負債・資本の部</h4>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-1 text-left">科目</th>
                <th className="border border-gray-300 px-3 py-1 text-right">期首</th>
                <th className="border border-gray-300 px-3 py-1 text-right">期末</th>
              </tr>
            </thead>
            <tbody>
              <BsRow label="買掛金" startField="accountsPayableStart" endField="accountsPayableEnd" />
              <BsRow label="未払金" startField="unpaidStart" endField="unpaidEnd" />
              <tr>
                <td className="border border-gray-300 px-3 py-1">事業主貸</td>
                <td className="border border-gray-300 px-3 py-1 text-right text-gray-400">-</td>
                <CopyCell value={adjusted.jigyounushiKashi} className="border border-gray-300" />
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-1">事業主借</td>
                <td className="border border-gray-300 px-3 py-1 text-right text-gray-400">-</td>
                <CopyCell value={data.jigyounushiKari} className="border border-gray-300" />
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-1">元入金</td>
                <EditableCell field="motoirekin" value={bs.motoirekin} />
                <CopyCell value={bs.motoirekin} className="border border-gray-300" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">確定申告</h2>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
          className="border-2 border-black rounded px-3 py-1 text-lg"
        >
          {years.map(y => <option key={y} value={y}>{y}年</option>)}
        </select>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        金額セルをクリックするとコピーできます。e-Taxの確定申告書作成コーナーに貼り付けてください。
      </p>

      {/* Sub-tabs */}
      <div className="flex space-x-1 border-b-2 border-black mb-4">
        <button onClick={() => setSubTab('kessan')} className={tabClass('kessan')}>
          青色申告決算書
        </button>
        <button onClick={() => setSubTab('withholding')} className={tabClass('withholding')}>
          源泉徴収票
        </button>
        <button onClick={() => setSubTab('furusato')} className={tabClass('furusato')}>
          ふるさと納税
        </button>
        <button onClick={() => setSubTab('form_b')} className={tabClass('form_b')}>
          確定申告書B
        </button>
      </div>

      {/* Sub-tab content */}
      {subTab === 'kessan' && renderKessanContent()}

      {subTab === 'withholding' && (
        <WithholdingTaxSection data={withholding} onDataChange={setWithholding} />
      )}

      {subTab === 'furusato' && (
        <FurusatoSection donations={furusatoDonations} onDonationsChange={setFurusatoDonations} />
      )}

      {subTab === 'form_b' && (
        <TaxFormB
          businessRevenue={data.revenue}
          businessIncome={income}
          blueDeduction={BLUE_DEDUCTION}
          withholding={withholding}
          furusatoDonations={furusatoDonations}
        />
      )}

      {subTab === 'kessan' && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded text-sm text-gray-700">
          <p className="font-bold mb-1">使い方:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>金額をクリックするとクリップボードにコピーされます</li>
            <li>「前年の決算書PDFを読み込む」で期首残高と元入金を自動入力できます（e-TaxのPDFに対応）</li>
            <li>期首の金額は手動でも入力できます（前年の期末残高を転記）</li>
            <li>「その他の預金」期末は自動計算: 期首 + 売上 - 経費 - 事業主貸 + 事業主借</li>
            <li>各タブで源泉徴収票・ふるさと納税を入力すると「確定申告書B」タブで税額が自動計算されます</li>
          </ul>
        </div>
      )}
    </div>
  );
};
