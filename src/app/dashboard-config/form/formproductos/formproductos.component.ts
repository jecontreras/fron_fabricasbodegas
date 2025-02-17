import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ProductoService } from 'src/app/servicesComponents/producto.service';
import { ToolsService } from 'src/app/services/tools.service';
import * as _ from 'lodash';
import { CategoriasService } from 'src/app/servicesComponents/categorias.service';
import { TipoTallasService } from 'src/app/servicesComponents/tipo-tallas.service';
import { ArchivosService } from 'src/app/servicesComponents/archivos.service';
import { environment } from 'src/environments/environment';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { ProductosOrdenarComponent } from '../../table/productos-ordenar/productos-ordenar.component';
import { STORAGES } from 'src/app/interfaces/sotarage';
import { Store } from '@ngrx/store';

const URL = environment.url;

@Component({
  selector: 'app-formproductos',
  templateUrl: './formproductos.component.html',
  styleUrls: ['./formproductos.component.scss']
})
export class FormproductosComponent implements OnInit {

  data: any = {};
  id: any;
  titulo: string = "Crear";
  files: File[] = [];
  list_files: any = [];
  listCategorias: any = [];
  listTipoTallas: any = [];
  listColor: any = [];
  editorConfig: any;
  listPrecios: any = [];
  listPreciosCliente:any = [];
  listGaleria: any = [];

  btnDisabled: boolean = false;
  disableEliminar: boolean = false;
  tallaSelect: any = [];
  formatoMoneda:any = {};

  disableSpinner:boolean = false;
  dataUser:any = {};

  constructor(
    public dialog: MatDialog,
    private _productos: ProductoService,
    private _categoria: CategoriasService,
    private _tipoTallas: TipoTallasService,
    private _tools: ToolsService,
    public dialogRef: MatDialogRef<FormproductosComponent>,
    @Inject(MAT_DIALOG_DATA) public datas: any,
    private _archivos: ArchivosService,
    private _store: Store<STORAGES>,
  ) {
    this.editor();
    this.formatoMoneda = this._tools.formatoMoneda;
    this._store.subscribe((store: any) => {
      store = store.name;
      this.dataUser = store.user || {};
    });
  }

  ngOnInit() {
    this.disableSpinner = true;
    if (Object.keys(this.datas.datos).length > 0) {
      this.data = _.clone(this.datas.datos);
      this.id = this.data.id;
      this.titulo = "Actualizar";
      this.tallaSelect = this.data.listaTallas || [],
      this.procesoEdision();
    } else { this.id = ""; this.data.pro_codigo = this.codigo(); this.data.pro_sw_tallas = 1; this.disableSpinner = false; }
    this.getCategorias();
    this.getTipoTallas();
  }

  ordenActualizar() {
    const dialogRef = this.dialog.open(ProductosOrdenarComponent, {
      data: { datos: {} },
      height: '550px',
      width: '100%',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }

  procesoEdision() {
    if (this.data.checkMayor) this.data.checkMayor = true;
    this.listPrecios = this.data.listPrecios || [];
    if (this.data.pro_categoria) if (this.data.pro_categoria.id) this.data.pro_categoria = this.data.pro_categoria.id;
    this.listColor = this.data.listColor || [];
    this.listPreciosCliente = this.data.listPreciosCliente || [];
    //if( !this.data.activarBTN ) this.getMisPrecios();
  }

  async getMisPrecios(){
    let result:any = await this.getPrecio( { id: this.data.id });
    if( result ) this.listPrecios = result.listPrecios || this.data.listPrecios;
  }

  getCategorias() {
    this._categoria.get({ where: { cat_activo: 0 }, limit: 100 }).subscribe((res: any) => {
      this.listCategorias = res.data;
      this.disableSpinner = false;
    }, error => this._tools.presentToast("error servidor"));
  }

  getTipoTallas() {
    this._tipoTallas.get({ where: { tit_sw_activo: "1" }, limit: 100 }).subscribe((res: any) => {
      this.listTipoTallas = res.data;
      if( this.data.id ) this.blurTalla(2);
    }, error => this._tools.presentToast("error servidor"));
  }

  onSelect(event: any) {
    //console.log(event, this.files);
    this.files = [event.addedFiles[0]]
  }


  onRemove(event) {
    //console.log(event);
    this.files.splice(this.files.indexOf(event), 1);
  }

  codigo() {
    return (Date.now().toString(20).substr(2, 3) + Math.random().toString(20).substr(2, 3)).toUpperCase();
  }

  subirFile(item: any) {
    let form: any = new FormData();
    form.append('file', this.files[0]);
    this._tools.ProcessTime({});
    //this._archivos.create( this.files[0] );
    this._archivos.create(form).subscribe((res: any) => {
      // console.log(res);
      if (item == false) {
        this.data.foto = res.files;//URL+`/${res}`;
        if (this.id) this.submit();
      }
      else item.foto = res.files;
      this._tools.presentToast("Exitoso");
    }, (error) => { console.error(error); this._tools.presentToast("Error de servidor") });

  }

  guardarColor(item: any) {
    item.check = true;
    this.data.listColor = this.listColor;
    if (this.id) this.submit();
  }
  EliminarColor(idx: any) {
    this.listColor.splice(idx, 1);
    this.data.listColor = this.listColor;
    if (this.id) this.submit();
  }

  submit() {
    // valida si es el administrador
    if( !this.data.activarBTN ) return false;
    ///////////////////////////////////////////
    if (this.data.cat_activo) this.data.cat_activo = 0;
    else this.data.cat_activo = 1;
    if (this.data.checkMayor) this.data.checkMayor = 1;
    else this.data.checkMayor = 0;
    if (this.id) {
      this.updates();
    }
    else { this.guardar(); }
  }

  TallaPush() {
    this.listColor.push({
      codigo: this.codigo()
    });
  }

  PrecioPush( opt:string) {
    if( opt == "vendedor"){
      this.listPrecios.push({
        codigo: this.codigo()
      });
    }else{
      this.listPreciosCliente.push({
        codigo: this.codigo()
      });
    }
  }

  guardarPrecios(item: any, opt:string) {
    item.check = true;
    if( opt == 'vendedor'){
      this.data.listPrecios = this.listPrecios;
    }else{
      this.data.listPreciosCliente = this.listPreciosCliente;
    }
    if ( this.id ) this.submit();
  }

  EliminarTalla( idx: any, opt:string ) {
    if( opt == 'vendedor'){
      this.listPrecios.splice(idx, 1);
      this.data.listPrecios = this.listPrecios;
    }else{
      this.listPrecios.splice(idx, 1);
      this.data.listPreciosCliente = this.listPreciosCliente;
    }
    if ( this.id ) this.submit();
  }

  guardar() {
    return new Promise(resolve => {
      this._productos.create(this.data).subscribe((res: any) => {
        //console.log(res);
        this._tools.presentToast("Exitoso");
        this.data.id = res.id;
        resolve(res);
      }, (error) => { this._tools.presentToast("Error"); resolve(false) });
    });
    //this.dialog.closeAll();
  }
  updates() {
    // this.data = _.omit(this.data, [ ''])
    this.data = _.omitBy(this.data, _.isNull);
    this._productos.update(this.data).subscribe((res: any) => {
      this._tools.presentToast("Actualizado");
    }, (error) => { console.error(error); this._tools.presentToast("Error de servidor") });
  }
  onSelects(event: any) {
    //console.log(event, this.files);
    this.files.push(...event.addedFiles)
  }


  onRemoves(event) {
    //console.log(event);
    this.files.splice(this.files.indexOf(event), 1);
  }

  async seleccionandoImg(item: any) {
    if (!item.id && this.btnDisabled == true) return false;
    for (let row of this.listGaleria) row.check = false;
    item.check = !item.check;
    this.btnDisabled = true;
    this.data = await this.getProducto(item);
    this.id = this.data.id;
    this.btnDisabled = false;
    this.procesoEdision();
    this.blurTalla(0);
  }

  getProducto(obj: any) {
    return new Promise(resolve => {
      this._productos.get({ where: { id: obj.id } }).subscribe((res: any) => {
        res = res.data[0];
        if (!res) resolve(false);
        resolve(res);
      }, (error: any) => resolve(false));
    })
  }

  async subirFiles() {
    this.btnDisabled = true;
    for (let row of this.files) {
      await this.fileSubmit(row);
    }
    this.files = [];
    this.btnDisabled = false;
    this._tools.presentToast("Exitoso");

  }

  fileSubmit(row) {
    return new Promise(resolve => {
      let form: any = new FormData();
      form.append('file', row);
      this._tools.ProcessTime({});
      //this._archivos.create( this.files[0] );
      this._archivos.create(form).subscribe(async (res: any) => {
        //console.log(res);
        this.data = {
          "pro_nombre": this.codigo(),
          "foto": res.files,
          "pro_descripcion": `disponibles desde la talla 36 a la talla 43 echos en material sintético de muy buena calidad`,
          "pro_codigo": "3DBG1F",
          "pro_sw_tallas": 1,
          "pro_categoria": this.data.pro_categoria,
          "cat_activo": 1,
          "checkMayor": 0,
          "pro_uni_venta": this.data.pro_uni_venta || 0,
          "precioFabrica": this.data.precioFabrica || 0
        };
        this.blurTalla(0);
        let result: any = await this.guardar();
        if (!result) resolve(false);
        this.data.id = result.id;
        this.id = result.id;
        this.listGaleria.push(this.data);
        resolve(true);
      }, (error) => { console.error(error); this._tools.presentToast("Error de servidor"); });
    });
  }

  blurTalla(opt:number = 1) {
    let filtro = this.listTipoTallas.find(t => t.id == this.data.pro_sw_tallas);
    if (!filtro)
      return !1;
    this.tallaSelect = filtro.lista;
    for (let row of this.tallaSelect) row.check = !0;
    this.tallaSelect = _.orderBy(this.tallaSelect, ["tal_descripcion"], ["asc"]);
    if( opt == 2) {
      for(let row of this.tallaSelect){
        let consult:any = this.data.listaTallas.find( ( item:any )=> item.id == row.id );
        if( !consult ) row.check = false;
      }
    }
    this.data.listaTallas = this.tallaSelect;
    if(opt == 1) this.editarTalla();
  }

  tallaSeleccionando(t) {
    this.data.listaTallas = this.data.listaTallas.filter(e => e.id !== t.id);
    this.editarTalla()
  }

  editarTalla() {
    let t = {
      id: this.data.id,
      listaTallas: this.data.listaTallas
    };
    if (!t.id)
      return !1;
    this._productos.update(t).subscribe(t => {
      this._tools.presentToast("Actualizado Tallas")
    }
      , t => {
        console.error(t);
          this._tools.presentToast("Error de servidor")
      }
    )
  }

  async actualizarProductVendedor( ){
    return new Promise( async ( resolve ) =>{
      let data:any = { id: this.data.id };
      let precio:any = await this.getPrecio( data );
      let resultado:any = Object();
      if( !precio ) {
        data = {
          user: this.dataUser.id,
          producto: this.data.id,
          precio: this.data.pro_uni_venta || 0,
          listPrecios: this.listPrecios || []
        };
        resultado = await this.createPrecio( data );
      }else{
        data = {
          id: precio.id,
          precio: this.data.pro_uni_venta || 0,
          listPrecios: this.listPrecios
        };
        resultado = await this.updatePrecio( data );
      }
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

  editor() {
    let config: AngularEditorConfig = {
      editable: true,
      spellcheck: true,
      height: '300px',
      minHeight: '0',
      maxHeight: 'auto',
      width: 'auto',
      minWidth: '0',
      translate: 'yes',
      enableToolbar: true,
      showToolbar: true,
      placeholder: 'Enter text here...',
      defaultParagraphSeparator: '',
      defaultFontName: '',
      defaultFontSize: '',
      fonts: [
        { class: 'arial', name: 'Arial' },
        { class: 'times-new-roman', name: 'Times New Roman' },
        { class: 'calibri', name: 'Calibri' },
        { class: 'comic-sans-ms', name: 'Comic Sans MS' }
      ],
      customClasses: [
        {
          name: 'quote',
          class: 'quote',
        },
        {
          name: 'redText',
          class: 'redText'
        },
        {
          name: 'titleText',
          class: 'titleText',
          tag: 'h1',
        },
      ],
      uploadUrl: 'v1/image',
      uploadWithCredentials: false,
      sanitize: true,
      toolbarPosition: 'top',
      toolbarHiddenButtons: [
        ['bold', 'italic'],
        ['fontSize']
      ]
    };
    this.editorConfig = config;
  }

  eliminarSeleccion(item: any) {
    let data: any = { id: item.id };
    this.disableEliminar = true;
    this._productos.delete(data).subscribe((res: any) => {
      this.disableEliminar = false;
      this.listGaleria = this.listGaleria.filter((row: any) => row.id !== item.id);
      this.data = {
        pro_codigo: this.codigo(),
        pro_sw_tallas: 1
      };
      this._tools.presentToast("Eliminado Exitos");
    }, (error: any) => { this._tools.presentToast("Error de servidor"); this.disableEliminar = false; })
  }

  eventoDescripcion() {
    // console.log("HP")
  }

}