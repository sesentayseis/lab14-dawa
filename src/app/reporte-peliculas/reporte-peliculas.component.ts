import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';


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
        margin: [0, 0, 0, 10] // Agrega los márgenes al encabezado
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'white',
        fillColor: '#007bff' // Personaliza el color de fondo del encabezado de la tabla
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
    // Lógica para filtrar las películas según los criterios seleccionados
    let peliculasFiltradas = this.peliculas;

    if (this.filtroGenero) {
      peliculasFiltradas = peliculasFiltradas.filter(pelicula => pelicula.genero === this.filtroGenero);
    }

    if (this.filtroAnio) {
      peliculasFiltradas = peliculasFiltradas.filter(pelicula => pelicula.lanzamiento === this.filtroAnio);
    }

    // Actualizar las películas a mostrar en el informe PDF
    this.generarPDF(peliculasFiltradas);
  }
}
