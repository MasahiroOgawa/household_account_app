import React, { useRef, useState } from 'react';
import { WithholdingTaxData, parseWithholdingTaxPdf } from '../utils/withholdingTaxPdfParser';

const fmt = (n: number) => n.toLocaleString('ja-JP');

interface WithholdingTaxSectionProps {
  data: WithholdingTaxData | null;
  onDataChange: (data: WithholdingTaxData) => void;
}

const FIELDS: { key: keyof WithholdingTaxData; label: string; group: string }[] = [
  { key: 'grossSalary', label: '支払金額', group: 'main' },
  { key: 'salaryIncomeAfterDeduction', label: '給与所得控除後の金額', group: 'main' },
  { key: 'totalDeductions', label: '所得控除の額の合計額', group: 'main' },
  { key: 'withheldTax', label: '源泉徴収税額', group: 'main' },
  { key: 'socialInsurance', label: '社会保険料等の金額', group: 'deduction' },
  { key: 'lifeInsuranceDeduction', label: '生命保険料の控除額', group: 'deduction' },
  { key: 'earthquakeInsuranceDeduction', label: '地震保険料の控除額', group: 'deduction' },
  { key: 'basicDeduction', label: '基礎控除の額', group: 'deduction' },
  { key: 'oldLifeInsurancePremium', label: '旧生命保険料の金額', group: 'detail' },
  { key: 'newLifeInsurancePremium', label: '新生命保険料の金額', group: 'detail' },
  { key: 'medicalInsurancePremium', label: '介護医療保険料の金額', group: 'detail' },
  { key: 'oldPensionInsurancePremium', label: '旧個人年金保険料の金額', group: 'detail' },
  { key: 'newPensionInsurancePremium', label: '新個人年金保険料の金額', group: 'detail' },
];

const emptyData: WithholdingTaxData = {
  grossSalary: 0,
  salaryIncomeAfterDeduction: 0,
  totalDeductions: 0,
  withheldTax: 0,
  socialInsurance: 0,
  lifeInsuranceDeduction: 0,
  earthquakeInsuranceDeduction: 0,
  basicDeduction: 0,
  oldLifeInsurancePremium: 0,
  newLifeInsurancePremium: 0,
  medicalInsurancePremium: 0,
  oldPensionInsurancePremium: 0,
  newPensionInsurancePremium: 0,
};

export const WithholdingTaxSection: React.FC<WithholdingTaxSectionProps> = ({ data, onDataChange }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const current = data || emptyData;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const parsed = await parseWithholdingTaxPdf(file);
      onDataChange(parsed);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'PDF読み込みに失敗しました');
    }
    e.target.value = '';
  };

  const handleFieldChange = (key: keyof WithholdingTaxData, value: string) => {
    onDataChange({ ...current, [key]: parseInt(value, 10) || 0 });
  };

  const renderGroup = (groupName: string, label: string) => (
    <div key={groupName} className="mb-4">
      <h4 className="text-sm font-bold mb-1 text-gray-700">{label}</h4>
      <table className="w-full border-collapse border border-gray-300 text-sm">
        <tbody>
          {FIELDS.filter(f => f.group === groupName).map(f => (
            <tr key={f.key}>
              <td className="border border-gray-300 px-3 py-1 w-1/2">{f.label}</td>
              <td className="border border-gray-300 px-1 py-1">
                <input
                  type="number"
                  value={current[f.key] || ''}
                  onChange={e => handleFieldChange(f.key, e.target.value)}
                  className="w-full text-right border border-gray-300 rounded px-2 py-0.5"
                />
              </td>
              <td className="border border-gray-300 px-3 py-1 text-right text-gray-500 w-32">
                {fmt(current[f.key])}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <input type="file" accept=".pdf" ref={fileRef} onChange={handleUpload} style={{ display: 'none' }} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={status === 'loading'}
          className="px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {status === 'loading' ? '読込中...' : '源泉徴収票PDFを読み込む'}
        </button>
        <span className="text-xs text-gray-500">手動入力も可能です</span>
      </div>

      {status === 'success' && (
        <div className="mb-2 p-2 bg-green-50 border border-green-300 rounded text-sm text-green-800">
          源泉徴収票を読み込みました。値が正しいか確認してください。
        </div>
      )}
      {status === 'error' && (
        <div className="mb-2 p-2 bg-red-50 border border-red-300 rounded text-sm text-red-800">{errorMsg}</div>
      )}

      {renderGroup('main', '主要項目')}
      {renderGroup('deduction', '控除項目')}
      {renderGroup('detail', '保険料内訳')}
    </div>
  );
};
