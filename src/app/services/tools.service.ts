import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import Swal from 'sweetalert2'

@Injectable({
  providedIn: 'root'
})
export class ToolsService {
  
  loading:any;
  formatoMoneda:any = { prefix: 'COP$ ',align: 'left', thousands: '.', decimal: ',', precision: 0 };

  constructor(
    private snackBar: MatSnackBar
  ) { }
 
  async presentToast(mensaje:string, type='completado') {
    this.snackBar.open(mensaje, type, {duration: 5000});
  }

  openSnack(message: string, type: string, config: any) {
    if (config) {
      this.snackBar.open(message, type, config);
    } else {
      this.snackBar.open(message, type, {duration: 5000});
    }
  }
  basic(text:string){
    Swal.fire(text)
  }
  basicIcons(text:any){
    Swal.fire(
      text.header,
      text.subheader,
      text.icon || 'question'
    );
  }
  error(text:any){
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: text.mensaje,
      footer: text.footer || '<a href>Why do I have this issue?</a>'
    });
  }
  tooast(text:any){
    Swal.fire({
      position: text.position || 'top-end',
      icon: text.icon || 'success',
      title: text.title || 'Your work has been saved',
      showConfirmButton: text.show || false,
      timer: 1500
    });
  }
  confirm(text:any){
    return Swal.fire({
      title: text.title || 'Are you sure?',
      text:  text.detalle || "You won't be able to revert this!",
      icon:  text.icon || 'warning',
      showCancelButton: true,
      confirmButtonColor: text.confirColor || '#3085d6',
      cancelButtonColor: text.cancelColor || '#d33',
      confirmButtonText: text.confir || 'Yes, delete it!'
    });
  }
  ProcessTime(text:any){
    let timerInterval
    Swal.fire({
      title:  text.title || 'Auto close alert!',
      html: 'I will close in <b></b> milliseconds.',
      timer: text.tiempo || 3000,
      timerProgressBar: true,
      onBeforeOpen: () => {
        Swal.showLoading()
        timerInterval = setInterval(() => {
          const content = Swal.getContent()
          if (content) {
          }
        }, 1000)
      },
      onClose: () => {
        clearInterval(timerInterval)
      }
    }).then((result) => {
      /* Read more about handling dismissals below */
      if (result.dismiss === Swal.DismissReason.timer) {
        console.log('I was closed by the timer')
      }
    })
  }

  calcularDistancia( params:any ) {

    let latitud1:any = params.latitud1;
    let longitud1:any = params.longitud1;
    let latitud2:any = params.latitud2;
    let longitud2:any = params.longitud2;
    let unidad_metrica:any = String();

    let distancia:any = Number();
    let radius:any = Number();
    radius = 6378.137;

    let deg2radMultiplier = Number();
    deg2radMultiplier = Math.PI / 180;

    latitud1 = latitud1 * deg2radMultiplier;
    longitud1 = longitud1 * deg2radMultiplier;

    latitud2 = latitud2 * deg2radMultiplier;
    longitud2 = longitud2 * deg2radMultiplier;

    let dlongitud = Number();
    dlongitud = longitud2 - longitud1;

        distancia = Math.acos(Math.sin(latitud1) * Math.sin(latitud2) + Math.cos(latitud1) *
        Math.cos(latitud2) * Math.cos(dlongitud)) * radius;

    if (unidad_metrica) unidad_metrica = 'M';
    distancia = distancia * 1000;

    return distancia;

  }
  

}
