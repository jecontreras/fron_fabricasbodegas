import { Component, OnInit, ViewChild } from '@angular/core';
import { ProductoService } from 'src/app/servicesComponents/producto.service';
import { MatDialog } from '@angular/material';
import { ViewProductosComponent } from '../view-productos/view-productos.component';
import { CART } from 'src/app/interfaces/sotarage';
import { Store } from '@ngrx/store';
import { CartAction, UserCabezaAction } from 'src/app/redux/app.actions';
import { ToolsService } from 'src/app/services/tools.service';
import { ActivatedRoute } from '@angular/router';
import { UsuariosService } from 'src/app/servicesComponents/usuarios.service';
import { NgImageSliderComponent } from 'ng-image-slider';
import { CategoriasService } from 'src/app/servicesComponents/categorias.service';
import * as _ from 'lodash';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss']
})
export class PedidosComponent implements OnInit {
  @ViewChild('nav', {static: true}) ds: NgImageSliderComponent;
  sliderWidth: Number = 1204;
  sliderImageWidth: Number = 211;
  sliderImageHeight: Number = 44;
  sliderArrowShow: Boolean = true;
  sliderInfinite: Boolean = false;
  sliderImagePopup: Boolean = true;
  sliderAutoSlide: Number = 1;
  sliderSlideImage: Number = 1;
  sliderAnimationSpeed: any = 1;
  query:any = {
    where:{
      pro_activo: 0
    },
    sort: "ordenarBy ASC",
    page: 0,
    limit: 15
  };
  seartxt:string = '';
  listProductos:any = [];
  loader:boolean = false;
  urlwhat:string
  userId:any = {};
  mySlideImages = [];
  imageObject:any = [];

  notscrolly:boolean=true;
  notEmptyPost:boolean = true;
  dataUser: any = {};
  rango:number = 0;

  constructor(
    private _productos: ProductoService,
    private _store: Store<CART>,
    public dialog: MatDialog,
    private _tools: ToolsService,
    private activate: ActivatedRoute,
    private _user: UsuariosService,
    private _categorias: CategoriasService,
    private spinner: NgxSpinnerService
  ) { 
    this._store.subscribe((store: any) => {
      //console.log(store);
      store = store.name;
      if(!store) return false;
      this.userId = store.usercabeza || {};
      this.dataUser = store.user || {};
    });

  }

  ngOnInit() {
    if( this.userId ) if( Object.keys( this.userId ).length > 0 ) this.query.idVendedor = this.userId.id;
    this.cargarProductos();
    if((this.activate.snapshot.paramMap.get('id'))) { this.userId = (this.activate.snapshot.paramMap.get('id')); this.getUser(); }
    this.getCategorias();
    this.detectarZona();
  }

  async detectarZona(){
    let zona:any = await this.myUbicacion();
    if( !zona ) return false;
    let data:any = {
      latitud1: zona.latitude,
      longitud1: zona.longitude,
      latitud2:  "7.888474",
      longitud2: "-72.497094"
    };
    let result:any = await this._tools.calcularDistancia( data );
    result = parseInt( result );
    if( 12111 >= result ) { this.rango = 0; console.log("esta en el rango");}
    else { this.rango = 10000; console.log("no esta en el rango"); }
    console.log( result );
    this.validadorPrecio();
  }

  myUbicacion(){
    return new Promise( resolve =>{
      if (navigator.geolocation) navigator.geolocation.getCurrentPosition(coords);
      else { console.log("No soportado"); resolve(false);}
      function coords(position) { resolve(position.coords); }
    });
  }

  validadorPrecio(){
    if( !this.dataUser.id ) if( this.userId.id ) this.rango = 0;
  }
  
  getUser(){
    this._user.get( { where: { id: this.userId } } ).subscribe((res:any)=>{ this.userId = res.data[0]; this.GuardarStoreUser() }, (error)=>{ console.error(error); this.userId = '';});
  }
  GuardarStoreUser(){
    let accion = new UserCabezaAction(this.userId, 'post');
    this._store.dispatch(accion);
  }
  getCategorias(){
    this._categorias.get( { where:{ cat_activo: 0 }, limit: 100 } ).subscribe((res:any)=>{ 
    for(let row of res.data){
      this.imageObject.push({
        image: row.cat_imagen || './assets/categoria.jpeg',
        thumbImage: row.cat_imagen,
        alt: '',
        id: row.id,
        title: row.cat_nombre
      });
    }
    this.imageObject.unshift({
      image: './assets/categoria.jpeg',
      thumbImage: './assets/categoria.jpeg',
      alt: '',
      check: true,
      id: 0,
      title: "Todos"
    });
  });
  }
  cargarProductos(){
    this.spinner.show();
    this._productos.get(this.query).subscribe((res:any)=>{
        console.log("res", res);
        this.loader = false;
        this.spinner.hide();
        this.listProductos = _.unionBy(this.listProductos || [], res.data, 'id');
        
        if (res.data.length === 0 ) {
          this.notEmptyPost =  false;
        }
        this.notscrolly = true;
        
    });
  }
  buscar() {
    //console.log(this.seartxt);
    this.loader = true;
    this.seartxt = this.seartxt.trim();
    this.listProductos = [];
    this.notscrolly = true; 
    this.notEmptyPost = true;
    if (this.seartxt === '') {
      this.query = {where:{pro_activo: 0},limit: 15, page: 0};
      this.cargarProductos();
    } else {
      this.query.where.or = [
        {
          pro_nombre: {
            contains: this.seartxt|| ''
          }
        },
        {
          pro_descripcion: {
            contains: this.seartxt|| ''
          }
        },
        {
          pro_descripcionbreve: {
            contains: this.seartxt|| ''
          }
        },
        {
          pro_codigo: {
            contains: this.seartxt|| ''
          }
        }
      ];
      this.cargarProductos();
    }
  }
  agregar(obj){
    const dialogRef = this.dialog.open(ViewProductosComponent,{
      width: '855px',
      maxHeight: "665px",
      data: { datos: obj }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    }); 
  }
  masInfo(obj:any){
    let cerialNumero:any = ''; 
    let numeroSplit:any;
    let cabeza:any = this.dataUser.cabeza;
    if( !obj.tallasSelect ) return this._tools.presentToast("Por Favor seleccionar una talla!");
    if( cabeza ){
      numeroSplit = _.split( cabeza.usu_telefono, "+57", 2);
      if( numeroSplit[1] ) cabeza.usu_telefono = numeroSplit[1];
      if( cabeza.usu_perfil == 3 ) cerialNumero = ( cabeza.usu_indicativo || '57' ) + ( cabeza.usu_telefono || '3147563817' );
      else cerialNumero = this.validarNumero();
    }else cerialNumero = this.validarNumero();
    if( this.userId.id ) this.urlwhat = `https://wa.me/${ this.userId.usu_indicativo || 57 }${ ( this.userId.usu_telefono || '3147563817') }?text=Hola Victor landazury cómo esta por favor me confirma disponibilidad de este modelo ${obj.pro_nombre} foto ==> ${ obj.foto } talla ${ ( obj.tallasSelect || 'cualquiera' ) } quedo pendiente`;
    else this.urlwhat = `https://wa.me/${ cerialNumero }?text=Hola Victor landazury cómo esta por favor me confirma disponibilidad de este modelo ${obj.pro_nombre} foto ==> ${ obj.foto } talla ${ ( obj.tallasSelect || 'cualquiera' ) } quedo pendiente`;
    window.open(this.urlwhat);
  }

  validarNumero(){
    if( Object.keys( this.dataUser ).length > 0 ) return "573154074456";
    else return "573147563817";
  }
  
  maxCantidad(obj:any){
    if(!obj.cantidadAdquirir) obj.cantidadAdquirir = 1;
    obj.cantidadAdquirir++;
    obj.pro_uni_ventaEdit = ( obj.cantidadAdquirir * obj.pro_uni_venta );
  }
  
  manualCantidad(obj:any){
    if(!obj.cantidadAdquirir) obj.cantidadAdquirir = 1;
    obj.pro_uni_ventaEdit = ( obj.cantidadAdquirir * obj.pro_uni_venta );
  }

  menosCantidad(obj){
    if(!obj.cantidadAdquirir) obj.cantidadAdquirir = 1;
    obj.cantidadAdquirir = obj.cantidadAdquirir-1;
    if(obj.cantidadAdquirir <= -1 ) obj.cantidadAdquirir = 0;
    obj.pro_uni_ventaEdit = ( obj.cantidadAdquirir * obj.pro_uni_venta );
  }

  AgregarCart(item:any){
    console.log(item);
    if( !item.tallasSelect ) return this._tools.presentToast("Por Favor seleccionar una talla!");
    let data:any = {
      articulo: item.id,
      codigo: item.pro_codigo,
      titulo: item.pro_nombre,
      foto: item.foto,
      talla: item.tallasSelect || 'cualquiera',
      cantidad: item.cantidadAdquirir || 1,
      costo: item.pro_uni_venta,
      costoTotal: ( item.pro_uni_venta*( item.cantidadAdquirir || 1 ) ),
      id: this.codigo()
    };
    let accion = new CartAction(data, 'post');
    this._store.dispatch(accion);
    this._tools.presentToast("Agregado al Carro");
  }
  
  imageOnClick(index:any, obj:any) {
      //console.log('index', index, this.imageObject[index]);
      for(let row of this.imageObject) row.check = false;
      obj.check = true;
      this.query = { where:{ pro_activo: 0 }, page: 0, limit: 10 };
      if( this.imageObject[index].id >0 ) this.query = { where:{ pro_activo: 0, pro_categoria: this.imageObject[index].id }, page: 0, limit: 10 };
      this.listProductos = [];
      this.notscrolly = true; 
      this.notEmptyPost = true;
      this.cargarProductos();
  }

  arrowOnClick(event) {
      //console.log('arrow click event', event);
  }

  lightboxArrowClick(event) {
      //console.log('popup arrow click', event);
  }

  prevImageClick() {
      this.ds.prev();
  }

  nextImageClick() {
      this.ds.next();
  }

  onScroll(){
   if (this.notscrolly && this.notEmptyPost) {
      this.notscrolly = false;
      this.query.page++;
      this.cargarProductos();
    }
  }

  openShare( obj:any ){
    if (navigator['share']) {
      navigator['share']({
        title: obj.pro_nombre,
        text: obj.foto +" "+ obj.pro_descripcion + `link del producto ---> https://www.locomproaqui.com/productos/${ obj.id } }`,
        url: obj.foto,
      })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
    }else {
      console.log("no se pudo compartir porque no se soporta");
      let url = `https://www.facebook.com/sharer/sharer.php?kid_directed_site=0&u=https://www.locomproaqui.com/productos/15?u=https://www.locomproaqui.com/productos/${ obj.id }`;
      window.open( url );
    }
  }
  
  codigo(){
    return (Date.now().toString(20).substr(2, 3) + Math.random().toString(20).substr(2, 3)).toUpperCase();
  }

}