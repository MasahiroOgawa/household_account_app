export interface Transaction {
  id: string;
  date: string;
  time: string;
  amount: number;
  description: string;
  category: string;
  shopName: string;
  type: 'income' | 'expense';
  originalData?: any;
}

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface ImportedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}