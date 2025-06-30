<!--------------------------------
 - @Author: Ronnie Zhang
 - @LastEditor: Ronnie Zhang
 - @LastEditTime: 2023/12/05 21:29:43
 - @Email: zclzone@outlook.com
 - Copyright © 2023 Ronnie Zhang(大脸怪) | https://isme.top
 --------------------------------->

<template>
  <CommonPage back>
    <template #title-suffix>
      <NTag class="ml-12" type="warning">
        {{ route.query.attributeName }}
      </NTag>
    </template>
    <template #action>
      <NButton type="primary" @click="handleAdd()">
        <i class="i-material-symbols:add mr-4 text-18" />
        新增属性值
      </NButton>
    </template>

    <MeCrud
      ref="$table"
      v-model:query-items="queryItems"
      :scroll-x="1200"
      :columns="columns"
      :get-data="api.readValue"
    >
      <MeQueryItem label="属性值" :label-width="50">
        <n-input
          v-model:value="queryItems.value"
          type="text"
          placeholder="请输入属性值"
          clearable
        />
      </MeQueryItem>

      <MeQueryItem label="状态" :label-width="50">
        <n-select
          v-model:value="queryItems.status"
          clearable
          :options="[
            { label: '启用', value: 1 },
            { label: '停用', value: 0 },
          ]"
        />
      </MeQueryItem>
    </MeCrud>
    <MeModal ref="modalRef" width="520px">
      <n-form
        ref="modalFormRef"
        label-placement="left"
        label-align="left"
        :label-width="80"
        :model="modalForm"
      >
        <n-form-item
          label="属性值"
          path="value"
          :rule="{
            required: true,
            message: '请输入属性值',
            trigger: ['input', 'blur'],
          }"
        >
          <n-input v-model:value="modalForm.value" />
        </n-form-item>
        <n-form-item label="排序">
          <n-input-number v-model:value="modalForm.sort" class="w-full" placeholder="请输入排序" />
        </n-form-item>
        <n-form-item label="状态">
          <NSwitch v-model:value="modalForm.status" :checked-value="1" :unchecked-value="0">
            <template #checked>
              启用
            </template>
            <template #unchecked>
              停用
            </template>
          </NSwitch>
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="modalForm.description" type="textarea" placeholder="请输入备注" />
        </n-form-item>
      </n-form>
    </MeModal>
  </CommonPage>
</template>

<script setup>
import { NButton, NSwitch, NTag } from 'naive-ui'
import { h } from 'vue'
import { MeCrud, MeModal, MeQueryItem } from '@/components'
import { useCrud } from '@/composables'
import { formatDateTime } from '@/utils'
import api from './api'

defineOptions({ name: 'AttributeValue' })
const route = useRoute()

const $table = ref(null)
/** QueryBar筛选参数（可选） */

const queryItems = ref({
  attributeId: route.params.attributeId,
})

onMounted(() => {
  $table.value?.handleSearch()
})

const { modalRef, modalFormRef, modalForm, handleAdd, handleDelete, handleEdit }
  = useCrud({
    name: '属性值',
    doCreate: api.createValue,
    doDelete: api.deleteValue,
    doUpdate: api.updateValue,
    initForm: { attributeId: Number(route.params.attributeId), sort: 0, status: 1 },
    refresh: (_, keepCurrentPage) => $table.value?.handleSearch(keepCurrentPage),
  })

const columns = [
  { title: '属性值', key: 'value' },
  { title: '排序', key: 'sort' },
  {
    title: '状态',
    key: 'status',
    render: row =>
      h(
        NSwitch,
        {
          size: 'small',
          rubberBand: false,
          value: row.status,
          loading: !!row.loading,
          checkedValue: 1,
          uncheckedValue: 0,
          onUpdateValue: () => handleEnable(row),
        },
        {
          checked: () => '启用',
          unchecked: () => '停用',
        },
      ),
  },
  { title: '备注', key: 'description', render: row => h('span', row.description || '-') },
  {
    title: '创建时间',
    key: 'createDate',
    width: 180,
    render(row) {
      return h('span', formatDateTime(row.createTime))
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 320,
    align: 'right',
    fixed: 'right',
    hideInExcel: true,
    render(row) {
      return [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            style: 'margin-left: 12px;',
            onClick: () => handleEdit(row),
          },
          {
            default: () => '编辑',
            icon: () => h('i', { class: 'i-material-symbols:edit-outline text-14' }),
          },
        ),

        h(
          NButton,
          {
            size: 'small',
            type: 'error',
            style: 'margin-left: 12px;',
            onClick: () => handleDelete(row.id),
          },
          {
            default: () => '删除',
            icon: () => h('i', { class: 'i-material-symbols:delete-outline text-14' }),
          },
        ),
      ]
    },
  },
]

async function handleEnable(row) {
  row.loading = true
  try {
    await api.updateValue({ id: row.id, status: row.status === 1 ? 0 : 1 })
    row.loading = false
    $message.success('操作成功')
    $table.value?.handleSearch()
  }
  catch (error) {
    console.error(error)
    row.enableLoading = false
  }
}
</script>
