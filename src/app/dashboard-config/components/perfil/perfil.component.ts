import { Component, OnInit } from '@angular/core';
import { ServiciosService } from 'src/app/services/servicios.service';
import { UsuariosService } from 'src/app/servicesComponents/usuarios.service';
import { ToolsService } from 'src/app/services/tools.service';
import * as moment from  'moment';
import * as _ from 'lodash';
import { ArchivosService } from 'src/app/servicesComponents/archivos.service';
import { environment } from 'src/environments/environment';
import { STORAGES } from 'src/app/interfaces/sotarage';
import { Store } from '@ngrx/store';
import { UserAction } from 'src/app/redux/app.actions';

const URL = environment.url;
const URLFRON = environment.urlFront;

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss']
})
export class PerfilComponent implements OnInit {

  data:any = {};
  files: File[] = [];
  files_logo: File[] = [];
  list_files: any = [];
  urlTienda:string = `${ URLFRON }/pedidos/`;
  urlRegistro:string = `${ URLFRON }/registro/`;
  restaure:any = {};
  disableRestaure:boolean = false;

  constructor(
    private _model: ServiciosService,
    private _user: UsuariosService,
    private _tools: ToolsService,
    private _archivos: ArchivosService,
    private _store: Store<STORAGES>,
  ) { 
    this._store.subscribe((store: any) => {
      console.log(store);
      store = store.name;
      this.data = store.user;
    });
  }

  ngOnInit() {
    //this.data = this._model.dataUser || {};
    if(this.data.usu_fec_nacimiento) this.data.usu_fec_nacimiento = moment(this.data.usu_fec_nacimiento).format('DD/MM/YYYY');
    this.urlTienda+=this.data.id;
    this.urlRegistro+=this.data.id;
  }

  onSelect( event:any, opt:string = "usu_imagen" ) {
    if( opt == "usu_imagen") this.files=[event.addedFiles[0]]
    if( opt == "usu_logo") this.files_logo=[event.addedFiles[0]]
  }
  
  onRemove( event:any, opt:string = "usu_imagen" ) {
    //console.log(event);
    if( opt == "usu_imagen") this.files.splice(this.files.indexOf(event), 1);
    if( opt == "usu_logo") this.files_logo.splice(this.files_logo.indexOf(event), 1);
  }

  subirFile( opt:string ){
    let form:any = new FormData();
    if( opt == "usu_imagen" ) form.append('file', this.files[0]);
    if( opt == "usu_logo" ) form.append('file', this.files_logo[0]);
    this._tools.ProcessTime({});
    this._archivos.create(form).subscribe((res:any)=>{
      console.log(res);
      this.data[opt] = res.files; //URL+`/${res}`;
      this._tools.presentToast("Exitoso");
      this.Actualizar();
      if( opt == "usu_imagen" ) this.files = [];
      if( opt == "usu_logo" ) this.files_logo = [];
    },(error)=>{console.error(error); this._tools.presentToast("Error de servidor")});

  }

  CambiarPassword(){
    this._user.cambioPass({ id: this.data.id, password: this.restaure.passNew })
    .subscribe( (res:any)=>{ this.disableRestaure = false; this.restaure = {}; this._tools.presentToast("Actualizado Password"); },
    (error)=> { console.error(error); this._tools.presentToast("Error Servidor"); } );
  }

  Actualizar(){
    this.data = _.omit(this.data, ['usu_perfil', 'cabeza', 'nivel', 'empresa', 'createdAt', 'updatedAt',]);
    this.data = _.omitBy(this.data, _.isNull);
    this._user.update(this.data).subscribe((res:any)=>{
      //console.log(res);
      this._tools.presentToast("Actualizado");
      let accion = new UserAction(res, 'put');
      this._store.dispatch(accion);
    },(error)=>{console.error(error); this._tools.presentToast("Error de Servidor")})
  }
  
  abrrirTienda(){
    window.open(this.urlTienda);
  }

  copiarLink(){
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.urlTienda;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this._tools.openSnack('Copiado:' + ' ' + this.urlTienda, 'completado', false);
  }

  copiarLinkRegistro(){
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.urlRegistro;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this._tools.openSnack('Copiado:' + ' ' + this.urlRegistro, 'completado', false);
  }

}
