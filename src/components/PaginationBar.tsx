import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  paginaActual: number;
  totalPaginas: number;
  totalItems: number;
  tamanoPagina: number;
  onPageChange: (nuevaPagina: number) => void;
  etiquetaTabla: string;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  paginaActual,
  totalPaginas,
  totalItems,
  tamanoPagina,
  onPageChange,
  etiquetaTabla,
}) => {
  const desde = totalItems === 0 ? 0 : (paginaActual - 1) * tamanoPagina + 1;
  const hasta = Math.min(paginaActual * tamanoPagina, totalItems);

  return (
    <div
      aria-label={`Paginación de ${etiquetaTabla}`}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs text-[#1E1B4B]/80"
    >
      <div className="font-mono-tabular">
        Mostrando <strong>{desde}</strong>–<strong>{hasta}</strong> de <strong>{totalItems}</strong> registros
      </div>
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          disabled={paginaActual <= 1}
          onClick={() => onPageChange(paginaActual - 1)}
          aria-label={`Página anterior de ${etiquetaTabla}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 font-semibold rounded-md border border-indigo-200 bg-white text-[#1E1B4B] hover:bg-indigo-50 disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#4338CA]"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Anterior
        </button>
        <span className="font-mono-tabular px-2 font-semibold text-[#1E1B4B]">
          Página {paginaActual} de {totalPaginas}
        </span>
        <button
          type="button"
          disabled={paginaActual >= totalPaginas}
          onClick={() => onPageChange(paginaActual + 1)}
          aria-label={`Página siguiente de ${etiquetaTabla}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 font-semibold rounded-md border border-indigo-200 bg-white text-[#1E1B4B] hover:bg-indigo-50 disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#4338CA]"
        >
          Siguiente
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
