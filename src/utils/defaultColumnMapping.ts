export const defaultColumnMapping = {
  sources: {
    orico: {
      name: "オリコカード",
      filename: ["KAL1B*.csv"],
      columns: {
        date: 0,
        description: 1,
        amount: 8,
        type: "auto"
      },
      encoding: "shift-jis",
      skipRows: 10,
      dateFormat: "YYYY年MM月DD日"
    },
    
    paypay: {
      name: "PayPay",
      filename: ["detail*(2156).csv"],
      columns: {
        date: 0,
        description: 1,
        amount: 5,
        type: "expense"
      },
      encoding: "utf-8",
      skipRows: 1,
      dateFormat: "YYYY/MM/DD"
    },
    
    ufj: {
      name: "三菱UFJ銀行",
      filename: ["3022252_*.csv", "4614196_*.csv"],
      columns: {
        date: 0,
        description: 2,
        withdrawal: 3,
        deposit: 4,
        balance: 5
      },
      encoding: "shift-jis",
      skipRows: 1,
      dateFormat: "YYYY/MM/DD",
      accountNumberExtraction: true
    },
    
    jre: {
      name: "JRE銀行",
      filename: ["RB-torihikimeisai.csv"],
      columns: {
        date: 0,
        description: 3,
        amount: 1,
        balance: 2
      },
      encoding: "shift-jis",
      skipRows: 1,
      dateFormat: "YYYYMMDD"
    },
    
    smbc: {
      name: "三井住友銀行",
      filename: ["meisai.csv"],
      columns: {
        date: 0,
        description: 3,
        withdrawal: 1,
        deposit: 2,
        balance: 4
      },
      encoding: "shift-jis",
      skipRows: 1,
      dateFormat: "YYYY/MM/DD"
    },
    
    generic: {
      name: "汎用CSV",
      filename: ["*.csv"],
      columns: {
        date: 0,
        description: 1,
        amount: 2,
        category: 3,
        source: 4,
        type: 5
      },
      encoding: "utf-8",
      skipRows: 1,
      dateFormat: "YYYY-MM-DD"
    }
  },
  
  customMappings: {},
  
  detectionRules: {
    orico: {
      headerPatterns: ["ご利用日", "ご利用先", "ご利用者", "支払区分", "ご利用金額"],
      fileNamePattern: "orico|kal1b"
    },
    paypay: {
      headerPatterns: ["利用日", "利用店名", "利用金額"],
      fileNamePattern: "detail.*2156|paypay"
    },
    ufj: {
      headerPatterns: ["日付", "摘要", "お支払金額", "お預り金額"],
      fileNamePattern: "3022252_|4614196_|\\d{7}_"
    },
    jre: {
      headerPatterns: ["取引日", "取引内容", "お引出し", "お預入れ"],
      fileNamePattern: "rb-torihiki|jre"
    },
    smbc: {
      headerPatterns: ["年月日", "お引出し", "お預け入れ"],
      fileNamePattern: "meisai|smbc"
    }
  },
  
  internalTransferPatterns: [
    "振替",
    "口座振替",
    "自動振替",
    "定期振替",
    "積立",
    "自動積立",
    "カード引落",
    "クレジット引落",
    "PayPay残高チャージ",
    "チャージ",
    "残高移動"
  ],
  
  feePatterns: [
    "手数料",
    "ATM手数料",
    "振込手数料",
    "時間外手数料"
  ]
};