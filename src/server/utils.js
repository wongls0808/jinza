import fs from 'fs';
import csvParser from 'csv-parser';

export async function parseCSV(filePath) {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

export function removeDuplicates(accounts) {
  const unique = new Map();
  accounts.forEach((account) => {
    const key = `${account.accountNumber}-${account.transactionDate}`;
    if (!unique.has(key)) {
      unique.set(key, account);
    }
  });
  return Array.from(unique.values());
}