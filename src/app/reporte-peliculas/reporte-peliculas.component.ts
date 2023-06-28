import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  peliculas: any[] = [];
  generos: string[] = [];
  filtroGenero: string = '';
  filtroAnio: number = 0;

  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
      this.generos = this.obtenerGenerosUnicos(data);
    });
  }

  obtenerGenerosUnicos(peliculas: any[]): string[] {
    const generosSet = new Set<string>();

    peliculas.forEach(pelicula => {
      generosSet.add(pelicula.genero);
    });

    return Array.from(generosSet);
  }

  generarPDF(peliculas: any[]) {
    const contenido = [
      { text: 'Informe de Películas', style: 'header' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Título', style: 'tableHeader' },
              { text: 'Género', style: 'tableHeader' },
              { text: 'Año de lanzamiento', style: 'tableHeader' }
            ],
            ...peliculas.map(pelicula => [
              { text: pelicula.titulo, style: 'tableCell' },
              { text: pelicula.genero, style: 'tableCell' },
              { text: pelicula.lanzamiento.toString(), style: 'tableCell' }
            ])
          ]
        }
      }
    ];

    const estilos: any = {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'white',
        fillColor: '#007bff'
      },
      tableCell: {
        fontSize: 12
      }
    };

    const documentDefinition: TDocumentDefinitions = {
      content: contenido,
      styles: estilos
    };

    (pdfMake.createPdf(documentDefinition) as any).open();
  }

  aplicarFiltro() {
    let peliculasFiltradas = this.peliculas;

    if (this.filtroGenero) {
      peliculasFiltradas = peliculasFiltradas.filter(pelicula => pelicula.genero === this.filtroGenero);
    }

    if (this.filtroAnio) {
      peliculasFiltradas = peliculasFiltradas.filter(pelicula => pelicula.lanzamiento === this.filtroAnio);
    }

    return peliculasFiltradas;
  }

  aplicarFiltroPdf() {
    const peliculasFiltradas = this.aplicarFiltro();
    this.generarPDF(peliculasFiltradas);
  }

  aplicarFiltroXlxs() {
    const peliculasFiltradas = this.aplicarFiltro();
    this.generarExcel(peliculasFiltradas);
  }

  generarExcel(peliculas: any[]) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(peliculas);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Películas');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(data);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'informe-peliculas.xlsx';
    link.click();
  }
}
