import React from 'react';
import styles from '../pages/Teacher/teacher.module.css'; // Re-using teacher styles

/**
 * A reusable table component
 * @param {object[]} data - Array of data objects
 * @param {string[]} headers - Array of header strings
 * @param {string[]} dataKeys - Array of keys to access data in order
 */
function DynamicTable({ data, headers, dataKeys }) {
  if (data.length === 0) {
    return <p>No data found.</p>;
  }

  return (
    <table className={styles.resultsTable}>
      <thead>
        <tr>
          {headers.map(header => <th key={header}>{header}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {dataKeys.map(key => <td key={key}>{row[key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DynamicTable;