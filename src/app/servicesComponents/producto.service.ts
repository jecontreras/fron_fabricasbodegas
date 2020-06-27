import { Injectable } from '@angular/core';
import { ServiciosService } from '../services/servicios.service';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  constructor(
    private _model: ServiciosService
  ) { }

  get(query:any){
    return this._model.querys('tblproductos/querys',query, 'post');
  }
  create(query:any){
    return this._model.querys('tblproductos',query, 'post');
  }
  update(query:any){
    return this._model.querys('tblproductos/'+query.id, query, 'put');
  }
  delete(query:any){
    return this._model.querys('tblproductos/'+query.id, query, 'delete');
  }
  ordenar(query:any){
    return this._model.querys('tblproductos/ordenar', query, 'post');
  }
  getPrecios(query:any){
    return this._model.querys('tblproductoprecio/querys', query, 'post');
  }
  createPrecios( query:any ){
    return this._model.querys('tblproductoprecio',query, 'post');
  }
  updatePrecios( query:any ){
    return this._model.querys('tblproductoprecio/'+query.id ,query, 'put');
  }
  deletePrecios( query:any ){
    return this._model.querys('tblproductoprecio/'+query.id ,query, 'delete');
  }
}
