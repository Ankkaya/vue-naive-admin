/**********************************
 * @Author: Ronnie Zhang
 * @LastEditor: Ronnie Zhang
 * @LastEditTime: 2023/12/05 21:29:27
 * @Email: zclzone@outlook.com
 * Copyright © 2023 Ronnie Zhang(大脸怪) | https://isme.top
 **********************************/

import { request } from '@/utils'

export default {
  create: data => request.post('/attributes', data),
  read: (params = {}) => request.get('/attributes', { params }),
  readAll: (params = {}) => request.get('/attributes/list', { params }),
  update: data => request.patch(`/attributes/${data.id}`, data),
  delete: id => request.delete(`/attributes/${id}`),

  createValue: data => request.post('/attribute-values', data),
  readValue: (params = {}) => request.get('/attribute-values', { params }),
  updateValue: data => request.patch(`/attribute-values/${data.id}`, data),
  deleteValue: id => request.delete(`/attribute-values/${id}`),
}
