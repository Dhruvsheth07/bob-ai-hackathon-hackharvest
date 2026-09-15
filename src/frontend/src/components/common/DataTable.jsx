import React from 'react';
import { cn } from '../../utils/cn';

function DataTable({ columns, data, className, rowClassName }) {
  return (
    <div className={cn("w-full overflow-auto border border-outline-variant rounded-md", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="border-b border-outline-variant bg-surface-container-low">
          <tr className="border-b border-outline-variant transition-colors hover:bg-surface-container/50">
            {columns.map((col, i) => (
              <th
                key={i}
                className="h-10 px-4 text-left align-middle font-medium text-on-surface-variant [&:has([role=checkbox])]:pr-0"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0 bg-surface">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center text-on-surface-variant">
                No results.
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-outline-variant transition-colors hover:bg-surface-container-high data-[state=selected]:bg-surface-container",
                  rowClassName
                )}
              >
                {columns.map((col, j) => (
                  <td key={j} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                    {col.cell ? col.cell(row) : row[col.accessorKey]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable };
