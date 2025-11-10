import React from 'react';
import styles from '../pages/Teacher/teacher.module.css'; // Re-using teacher styles

/**
 * A reusable table component
 * @param {object[]} data - Array of data objects
 * @param {string[]} headers - Array of header strings
 * @param {string[]} [dataKeys] - Array of simple keys (e.g., ['id', 'name'])
 * @param {function} [dataKeysFn] - A function that returns an array for a row (e.g., (row) => [row.id, `${row.fName} ${row.lName}`])
 */
function DynamicTable({ data, headers, dataKeys, dataKeysFn }) {
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
            {/* --- UPDATED LOGIC --- */}
            {/* Check if dataKeysFn is provided, else use dataKeys */}
            {dataKeysFn ? (
              dataKeysFn(row).map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))
            ) : (
              dataKeys.map(key => (
                // Handle function-in-array (for StudentTeacherDetails)
                <td key={key}>
                  {typeof key === 'function' ? key(row) : row[key]}
                </td>
              ))
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DynamicTable;