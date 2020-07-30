import { Component, OnInit } from '@angular/core';
import { ToolsService } from 'src/app/services/tools.service';
import { MatDialog } from '@angular/material';
import { ProductoService } from 'src/app/servicesComponents/producto.service';
import { FormproductosComponent } from '../../form/formproductos/formproductos.component';
import { NgxSpinnerService } from 'ngx-spinner';
import * as _ from 'lodash';
import { ProductosOrdenarComponent } from '../../table/productos-ordenar/productos-ordenar.component';
import { STORAGES } from 'src/app/interfaces/sotarage';
import { Store } from '@ngrx/store';

declare interface DataTable {
  headerRow: string[];
  footerRow: string[];
  dataRows: any[][];
}

declare const swal: any;
declare const $: any;


@Component({
  selector: 'app-productos',
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss']
})
export class ProductosComponent implements OnInit {

  dataTable: DataTable;
  pagina = 10;
  paginas = 0;
  loader = true;
  query:any = {
    where:{
      pro_activo: 0
    },
    sort: "ordenarBy ASC",
    page: 0,
    limit: 10
  };
  Header:any = [ 'Acciones','Foto','Nombre','Codigo', 'Precio Vendedor', 'Precio Cliente','Categoria','Estado', 'Creado'];
  $:any;
  public datoBusqueda = '';
  notscrolly:boolean=true;
  notEmptyPost:boolean = true;
  formatoMoneda:any = {};
  dataUser:any = {};
  activando:boolean = false;
  disabledBtn:boolean = false;

  constructor(
    public dialog: MatDialog,
    private _tools: ToolsService,
    private _productos: ProductoService,
    private spinner: NgxSpinnerService,
    private _store: Store<STORAGES>,
  ) {
    this._store.subscribe((store: any) => {
      store = store.name;
      this.dataUser = store.user || {};
      if(this.dataUser.usu_perfil.prf_descripcion == 'administrador') this.activando = true;
      else this.activando = false;
    });
   }

  ngOnInit() {
    this.dataTable = {
      headerRow: this.Header,
      footerRow: this.Header,
      dataRows: []
    };
    this.cargarTodos();
    this.formatoMoneda = this._tools.formatoMoneda;
  }

  async crear(obj:any){
    //if(!this.activando ) return false;
    if( this.disabledBtn ) return false;
    this.disabledBtn = true;
    if( obj ) {
      obj = await this.getProductoId( obj.id );
      if( !obj ) return this._tools.presentToast("Estamos teniendo Problemas al encontrar este producto!");
    }
    this.disabledBtn = false;
    obj.activarBTN = this.activando;
    const dialogRef = this.dialog.open(FormproductosComponent,{
      data: { datos: obj || {} },
      height:  '550px',
      width: '100%',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  getProductoId( id:any ){
    return new Promise( resolve=>{
      this._productos.get({ where: { id: id }, limit: 1 }).subscribe((res:any)=>{
        res = res.data[0];
        if( !res ) return resolve( false );
        else return resolve( res );
      },( error:any )=> resolve( false ));
    })
  }

  delete(obj:any, idx:any){
    if(!this.activando ) return false;
    let datos = {
      id: obj.id,
      pro_activo: 1
    }
    if( this.disabledBtn ) return false;
    this.disabledBtn = true;
    this._tools.confirm({title:"Eliminar", detalle:"Deseas Eliminar Dato", confir:"Si Eliminar"}).then((opt)=>{
      if(opt.value){
        this._productos.update(datos).subscribe((res:any)=>{
          this.disabledBtn = false;
          this.dataTable.dataRows.splice(idx, 1);
          this._tools.presentToast("Eliminado")
        },(error)=>{console.error(error); this._tools.presentToast("Error de servidor"); this.disabledBtn = false; })
      }
    });
  }

  onScroll(){
    if (this.notscrolly && this.notEmptyPost) {
       this.notscrolly = false;
       this.query.page++;
       this.cargarTodos();
     }
  }

  cargarTodos() {
    this.spinner.show();
    if( !this.activando ) this.query.idVendedor = this.dataUser.id;
    this._productos.get(this.query)
    .subscribe(
      (response: any) => {
        console.log(response);
        this.dataTable.headerRow = this.dataTable.headerRow;
        this.dataTable.footerRow = this.dataTable.footerRow;
        this.dataTable.dataRows.push(... response.data);
        this.dataTable.dataRows =_.unionBy(this.dataTable.dataRows || [], response.data, 'id');
        this.loader = false;
        this.spinner.hide();

        if (response.data.length === 0 ) {
          this.notEmptyPost =  false;
        }
        this.notscrolly = true;
      },
      error => {
        console.log('Error', error);
      });
  }

  ordenarProductos(){
    const dialogRef = this.dialog.open(ProductosOrdenarComponent,{
      data: {datos: {}},
      height:  '550px',
      width: '100%',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  buscar() {
    this.loader = false;
    this.notscrolly = true 
    this.notEmptyPost = true;
    this.dataTable.dataRows = [];
    //console.log(this.datoBusqueda);
    this.datoBusqueda = this.datoBusqueda.trim();
    if (this.datoBusqueda === '') {
      this.query = {
        where:{
          pro_activo: 0
        },
        limit: 10
      }
      this.cargarTodos();
    } else {
      this.query.where.or = [
        {
          pro_nombre: {
            contains: this.datoBusqueda|| ''
          }
        },
        {
          pro_descripcion: {
            contains: this.datoBusqueda|| ''
          }
        },
        {
          pro_descripcionbreve: {
            contains: this.datoBusqueda|| ''
          }
        },
        {
          pro_codigo: {
            contains: this.datoBusqueda|| ''
          }
        }
      ];
      this.cargarTodos();
    }
  }

  async actualizar( item:any, opt:string ){
    let data:any = { id: item.id };
    data[opt] = item[opt];
    if( !this.activando && opt == "precioFabrica" ) return false;
    if( this.disabledBtn ) return false;
    this.disabledBtn = true;
    if( this.activando ) await this.actualizarProduc( data, opt );
    else await this.actualizarProductVendedor( item , opt );
    this.disabledBtn = false;
  }

  actualizarProduc( data:any, opt:string ){
    return new Promise( resolve =>{
      this._productos.update( data ).subscribe((res:any)=> { this._tools.presentToast("Actualizado "+ opt); resolve(res); },(error:any)=> { this._tools.presentToast("Error de actualizacion"); resolve( false ) });
    })
  }

  async actualizarProductVendedor( item:any, opt:string ){
    return new Promise( async ( resolve ) =>{
      let data:any = { id: item.id };
      let precio:any = await this.getPrecio( data );
      let resultado:any = Object();
      if( !precio ) {
        data = {
          user: this.dataUser.id,
          producto: item.id,
          precio: item.pro_uni_venta
        };
        resultado = await this.createPrecio( data );
      }else{
        data = {
          id: precio.id,
          precio: item.pro_uni_venta
        };
        resultado = await this.updatePrecio( data );
      }
      data = { id: item.id };
      data[opt] = item[opt];
      this.actualizarProduc( data, opt );
      resolve( true );
    })
  }
  
  async getPrecio( data:any ){
    return new Promise( resolve=>{
      this._productos.getPrecios( { where: { producto: data.id, user: this.dataUser.id }, limit: 1 }).subscribe( ( res:any )=>{
        res = res.data[0];
        if( !res ) return resolve( false );
        return resolve( res );
      } ,( error:any )=> resolve( false ));
    });
  }

  async createPrecio( data ){
    return new Promise( resolve =>{
      this._productos.createPrecios( data ).subscribe((res:any)=>resolve( res ), (error:any)=> resolve( false ));
    })
  }

  async updatePrecio( data ){
    return new Promise( resolve =>{
      this._productos.updatePrecios( data ).subscribe((res:any)=>resolve( res ), (error:any)=> resolve( false ));
    })
  }

}
