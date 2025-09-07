// This file contains the actual column mapping data
// It's imported directly so we don't rely on localStorage or fetch

export const columnMappingData = {
  "sources": {
    "orico": {
      "name": "オリコカード",
      "filename": ["KAL1B*.csv", "KAL*.csv"],
      "columns": {
        "date": 0,
        "description": 1,
        "amount": 8
      },
      "encoding": "shift-jis",
      "skipRows": 10,
      "dateFormat": "YYYY年MM月DD日"
    },

    "paypay": {
      "name": "PayPay",
      "filename": ["detail*(2156).csv", "*2156*.csv"],
      "columns": {
        "date": 0,
        "description": 1,
        "amount": 5,
        "type": "expense"
      },
      "encoding": "utf-8",
      "skipRows": 1,
      "dateFormat": "YYYY/MM/DD"
    },

    "ufj": {
      "name": "三菱UFJ銀行",
      "filename": ["3022252_*.csv", "4614196_*.csv"],
      "columns": {
        "date": 0,
        "description": 2,
        "withdrawal": 3,
        "deposit": 4,
        "balance": 5
      },
      "encoding": "shift-jis",
      "skipRows": 1,
      "dateFormat": "YYYY/MM/DD",
      "accountNumberExtraction": true
    },

    "jre": {
      "name": "JRE銀行",
      "filename": ["RB-torihikimeisai.csv"],
      "columns": {
        "date": 0,
        "description": 3,
        "amount": 1,
        "balance": 2
      },
      "encoding": "shift-jis",
      "skipRows": 1,
      "dateFormat": "YYYYMMDD"
    },

    "smbc": {
      "name": "三井住友銀行",
      "filename": ["meisai.csv"],
      "columns": {
        "date": 0,
        "description": 3,
        "withdrawal": 1,
        "deposit": 2,
        "balance": 4
      },
      "encoding": "shift-jis",
      "skipRows": 1,
      "dateFormat": "YYYY/MM/DD"
    },

    "generic": {
      "name": "汎用CSV",
      "filename": ["*.csv"],
      "columns": {
        "date": 0,
        "description": 1,
        "amount": 2,
        "category": 3,
        "source": 4,
        "type": 5
      },
      "encoding": "utf-8",
      "skipRows": 1,
      "dateFormat": "YYYY-MM-DD"
    }
  },

  "customMappings": {},

  "detectionRules": {
    "orico": {
      "headerPatterns": [
        "ご利用日",
        "ご利用先",
        "ご利用者",
        "ご利用金額"
      ],
      "fileNamePattern": "^KAL.*\\.csv$"
    },
    "paypay": {
      "headerPatterns": [
        "日時",
        "サービス名"
      ],
      "fileNamePattern": ".*\\(2156\\)\\.csv$"
    },
    "ufj": {
      "headerPatterns": [
        "日付",
        "摘要",
        "お支払金額"
      ],
      "fileNamePattern": "^\\d{7}_.*\\.csv$"
    },
    "jre": {
      "headerPatterns": [
        "取引日",
        "お支払い金額",
        "残高"
      ],
      "fileNamePattern": "RB-torihikimeisai\\.csv$"
    },
    "smbc": {
      "headerPatterns": [
        "年月日",
        "お引出し",
        "お預入れ"
      ],
      "fileNamePattern": "meisai\\.csv$"
    }
  },

  "internalTransferPatterns": [
    "振替",
    "振込",
    "入金",
    "出金",
    "口座振替",
    "自動引落",
    "ATM",
    "現金"
  ],

  "feePatterns": [
    "手数料",
    "利息",
    "利子",
    "年会費"
  ]
};