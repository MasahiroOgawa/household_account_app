import React, { useState, useMemo } from 'react';
import { TaxFormBFields, TaxCalculationInput, calculateTaxFormB } from '../utils/incomeTaxCalculator';
import { WithholdingTaxData } from '../utils/withholdingTaxPdfParser';
import { FurusatoDonation, FurusatoTaxSummary } from '../utils/furusatoTaxPdfParser';

const fmt = (n: number) => n.toLocaleString('ja-JP');

const CopyCell: React.FC<{ value: number; highlight?: boolean }> = ({ value, highlight }) => {
  const [copied, setCopied] = useState(false);
  const handleClick = () => {
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };
  return (
    <td
      className={`px-3 py-1.5 text-right cursor-pointer hover:bg-blue-50 select-all border border-gray-300 ${highlight ? 'bg-yellow-50 font-bold' : ''}`}
      onClick={handleClick}
      title="Click to copy"
    >
      {copied ? <span className="text-blue-600 text-xs">Copied!</span> : fmt(value)}
    </td>
  );
};

interface TaxFormBProps {
  businessRevenue: number;
  businessIncome: number;
  blueDeduction: number;
  withholding: WithholdingTaxData | null;
  furusatoDonations: FurusatoDonation[];
}

export const TaxFormB: React.FC<TaxFormBProps> = ({
  businessRevenue,
  businessIncome,
  blueDeduction,
  withholding,
  furusatoDonations,
}) => {
  const furusatoSummary: FurusatoTaxSummary | undefined = furusatoDonations.length > 0
    ? {
        donations: furusatoDonations,
        totalAmount: furusatoDonations.reduce((s, d) => s + d.amount, 0),
        deductibleAmount: Math.max(0, furusatoDonations.reduce((s, d) => s + d.amount, 0) - 2000),
      }
    : undefined;

  const input: TaxCalculationInput = {
    businessRevenue,
    businessIncome,
    blueDeduction,
    withholding: withholding || undefined,
    furusato: furusatoSummary,
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fields: TaxFormBFields = useMemo(() => calculateTaxFormB(input), [
    businessRevenue, businessIncome, blueDeduction, withholding, furusatoDonations,
  ]);

  const FormRow: React.FC<{ code: string; label: string; value: number; highlight?: boolean }> = ({ code, label, value, highlight }) => (
    <tr>
      <td className="border border-gray-300 px-3 py-1.5 text-center text-sm font-mono w-12">{code}</td>
      <td className="border border-gray-300 px-3 py-1.5 text-sm">{label}</td>
      <CopyCell value={value} highlight={highlight} />
    </tr>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        確定申告書等作成コーナーの各欄に対応しています。金額をクリックしてコピーし、転記してください。
      </p>

      {/* 収入金額等 */}
      <div>
        <h4 className="font-bold text-sm mb-1 bg-blue-100 px-3 py-1 border border-blue-300">収入金額等</h4>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <FormRow code="ア" label="事業・営業等" value={fields.incomeBusinessRevenue} />
            <FormRow code="カ" label="給与" value={fields.incomeSalary} />
          </tbody>
        </table>
      </div>

      {/* 所得金額等 */}
      <div>
        <h4 className="font-bold text-sm mb-1 bg-blue-100 px-3 py-1 border border-blue-300">所得金額等</h4>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <FormRow code="①" label="事業・営業等" value={fields.incomeBusinessAmount} />
            <FormRow code="⑥" label="給与" value={fields.incomeSalaryAmount} />
            <FormRow code="⑫" label="合計" value={fields.totalIncome} highlight />
          </tbody>
        </table>
      </div>

      {/* 所得から差し引かれる金額 */}
      <div>
        <h4 className="font-bold text-sm mb-1 bg-green-100 px-3 py-1 border border-green-300">所得から差し引かれる金額</h4>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <FormRow code="⑬" label="社会保険料控除" value={fields.deductionSocialInsurance} />
            <FormRow code="⑮" label="生命保険料控除" value={fields.deductionLifeInsurance} />
            <FormRow code="⑯" label="地震保険料控除" value={fields.deductionEarthquakeInsurance} />
            <FormRow code="㉔" label="基礎控除" value={fields.deductionBasic} />
            <FormRow code="㉘" label="寄附金控除" value={fields.deductionDonation} />
            <FormRow code="㉙" label="合計" value={fields.totalDeductions} highlight />
          </tbody>
        </table>
      </div>

      {/* 税額計算 */}
      <div>
        <h4 className="font-bold text-sm mb-1 bg-red-100 px-3 py-1 border border-red-300">税額計算</h4>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <FormRow code="㉚" label="課税される所得金額" value={fields.taxableIncome} />
            <FormRow code="㉛" label="上の㉚に対する税額" value={fields.incomeTaxOnTaxable} />
            <FormRow code="㊱" label="差引所得税額" value={fields.totalTaxAmount} />
            <FormRow code="㊲" label="復興特別所得税額" value={fields.reconstructionTax} />
            <FormRow code="㊳" label="所得税及び復興特別所得税の額" value={fields.totalWithReconstruction} />
            <FormRow code="㊹" label="源泉徴収税額" value={fields.withheldTaxTotal} />
          </tbody>
        </table>
      </div>

      {/* 納付/還付 */}
      <div className={`p-4 rounded border-2 ${fields.taxPayableOrRefund > 0 ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'}`}>
        <div className="flex justify-between items-center">
          <span className="font-bold text-lg">
            {fields.taxPayableOrRefund > 0 ? '㊺ 納付する税額' : '㊺ 還付される税額'}
          </span>
          <span className={`font-bold text-2xl cursor-pointer hover:opacity-70 ${fields.taxPayableOrRefund > 0 ? 'text-red-700' : 'text-green-700'}`}
            onClick={() => {
              navigator.clipboard.writeText(String(Math.abs(fields.taxPayableOrRefund)));
            }}
            title="Click to copy"
          >
            {fmt(Math.abs(fields.taxPayableOrRefund))} 円
          </span>
        </div>
      </div>

      {/* 青色申告特別控除 */}
      <div className="text-sm text-gray-600 mt-2">
        <span className="font-bold">青色申告特別控除額:</span> {fmt(fields.blueReturnDeduction)} 円
      </div>
    </div>
  );
};
