import React, { useState, useMemo } from 'react';
import { Transaction } from '../types/Transaction';
import { calculateBlueReturn, getSortedKamoku, getAvailableYears, BlueReturnData } from '../utils/blueReturnCalculator';

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

// 貸借対照表 editable fields
interface BalanceSheetState {
  cashStart: number;
  depositStart: number;
  accountsReceivableStart: number;
  accountsReceivableEnd: number;
  accountsPayableStart: number;
  accountsPayableEnd: number;
  motoirekin: number;
}

const defaultBalanceSheet: BalanceSheetState = {
  cashStart: 0,
  depositStart: 0,
  accountsReceivableStart: 0,
  accountsReceivableEnd: 0,
  accountsPayableStart: 0,
  accountsPayableEnd: 0,
  motoirekin: 0,
};

export const BlueReturnView: React.FC<BlueReturnViewProps> = ({ transactions }) => {
  const years = useMemo(() => getAvailableYears(transactions), [transactions]);
  const [selectedYear, setSelectedYear] = useState<number>(years[0] || new Date().getFullYear());
  const [bs, setBs] = useState<BalanceSheetState>(defaultBalanceSheet);

  const data: BlueReturnData = useMemo(
    () => calculateBlueReturn(transactions, selectedYear),
    [transactions, selectedYear]
  );

  const sortedKamoku = useMemo(() => getSortedKamoku(data.kamokuTotals), [data]);
  const profit = data.revenue - data.totalExpenses;
  const income = Math.max(0, profit - BLUE_DEDUCTION);

  // 貸借対照表 期末計算
  const depositEnd = bs.depositStart + data.revenue - data.totalExpenses - data.jigyounushiKashi + data.jigyounushiKari;

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">青色申告決算書</h2>
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
            <CopyCell value={data.totalExpenses} className="border border-gray-300 font-bold" />
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
            <CopyCell value={data.revenue} className="border border-gray-300 font-bold" />
            <CopyCell value={data.totalExpenses} className="border border-gray-300 font-bold" />
          </tr>
        </tbody>
      </table>

      {/* Section 3: 貸借対照表 */}
      <SectionTitle>貸借対照表（12月31日現在）</SectionTitle>
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
              <tr>
                <td className="border border-gray-300 px-3 py-1">現金</td>
                <EditableCell field="cashStart" value={bs.cashStart} />
                <CopyCell value={bs.cashStart} className="border border-gray-300" />
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-1">その他の預金</td>
                <EditableCell field="depositStart" value={bs.depositStart} />
                <CopyCell value={depositEnd} className="border border-gray-300" />
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-1">売掛金</td>
                <EditableCell field="accountsReceivableStart" value={bs.accountsReceivableStart} />
                <td className="px-3 py-1">
                  <input
                    type="number"
                    value={bs.accountsReceivableEnd || ''}
                    onChange={e => updateBs('accountsReceivableEnd', e.target.value)}
                    className="w-full text-right border border-gray-300 rounded px-2 py-0.5"
                  />
                </td>
              </tr>
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
              <tr>
                <td className="border border-gray-300 px-3 py-1">買掛金</td>
                <EditableCell field="accountsPayableStart" value={bs.accountsPayableStart} />
                <td className="px-3 py-1">
                  <input
                    type="number"
                    value={bs.accountsPayableEnd || ''}
                    onChange={e => updateBs('accountsPayableEnd', e.target.value)}
                    className="w-full text-right border border-gray-300 rounded px-2 py-0.5"
                  />
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-3 py-1">事業主貸</td>
                <td className="border border-gray-300 px-3 py-1 text-right text-gray-400">-</td>
                <CopyCell value={data.jigyounushiKashi} className="border border-gray-300" />
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

      <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded text-sm text-gray-700">
        <p className="font-bold mb-1">使い方:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>金額をクリックするとクリップボードにコピーされます</li>
          <li>期首の金額は手動で入力してください（前年の期末残高を転記）</li>
          <li>「その他の預金」期末は自動計算: 期首 + 売上 - 経費 - 事業主貸 + 事業主借</li>
          <li>国税庁 確定申告書等作成コーナー (keisan.nta.go.jp) に値を転記してください</li>
        </ul>
      </div>
    </div>
  );
};
