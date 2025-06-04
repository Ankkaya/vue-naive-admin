/**********************************
 * @Author: Ronnie Zhang
 * @LastEditor: Ronnie Zhang
 * @LastEditTime: 2023/12/05 21:29:51
 * @Email: zclzone@outlook.com
 * Copyright © 2023 Ronnie Zhang(大脸怪) | https://isme.top
 **********************************/

import { request } from '@/utils'

export default {
  create: data => request.post('/category', data),
  // 获取分类列表
  read: (params = {}) => request.get('/category', { params }),
  // 获取分类树型结构
  readTree: (params = {}) => request.get('/category/tree', { params }),
  // 移动分类位置
  move: data => request.patch(`/category/${data.id}/move`, data),
  // 更新分类状态
  updateStatus: data => request.patch(`/category/${data.id}/status`, data),
  // 更新分类显示状态
  updateShowInNav: data => request.patch(`/category/${data.id}/show-in-nav`, data),
  // 更新分类
  update: data => request.patch(`/category/${data.id}`, data),

  // 删除分类
  delete: id => request.delete(`/category/${id}`),
}
