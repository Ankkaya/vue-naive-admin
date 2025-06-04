<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleAdd()">
        <i class="i-material-symbols:add mr-4 text-18" />
        新增商品
      </NButton>
    </template>

    <MeCrud
      ref="$table"
      v-model:query-items="queryItems"
      :scroll-x="1200"
      :columns="columns"
      :get-data="api.read"
    >
      <MeQueryItem label="用户名" :label-width="50">
        <n-input
          v-model:value="queryItems.username"
          type="text"
          placeholder="请输入用户名"
          clearable
        />
      </MeQueryItem>

      <MeQueryItem label="性别" :label-width="50">
        <n-select v-model:value="queryItems.gender" clearable :options="genders" />
      </MeQueryItem>

      <MeQueryItem label="状态" :label-width="50">
        <n-select
          v-model:value="queryItems.enable"
          clearable
          :options="[
            { label: '启用', value: 1 },
            { label: '停用', value: 0 },
          ]"
        />
      </MeQueryItem>
    </MeCrud>

    <MeModal ref="modalRef" width="820px">
      <n-form
        ref="modalFormRef"
        label-placement="left"
        label-align="left"
        :label-width="80"
        :model="modalForm"
        :disabled="modalAction === 'view'"
      >
        <n-form-item
          label="商品名称"
          path="name"
          :rule="{
            required: true,
            message: '请输入商品名称',
            trigger: ['input', 'blur'],
          }"
        >
          <n-input v-model:value="modalForm.name" clearable />
        </n-form-item>
        <n-form-item label="商品图片">
          <n-upload :default-file-list="state.previewFileList" list-type="image-card" @preview="handlePreview" />
        </n-form-item>
        <n-form-item
          label="销售价格" path="price" :rule="{
            required: true,
            message: '请输入销售价格',
            trigger: ['input', 'blur'],
          }"
        >
          <n-input-number v-model:value="modalForm.price" class="w-full" :precision="2" placeholder="请输入销售价格">
            <template #prefix>
              ￥
            </template>
          </n-input-number>
        </n-form-item>
        <n-form-item
          label="成本价格" path="costPrice" :rule="{
            required: true,
            message: '请输入成本价格',
            trigger: ['input', 'blur'],
          }"
        >
          <n-input-number v-model:value="modalForm.costPrice" class="w-full" :precision="2" placeholder="请输入成本价格">
            <template #prefix>
              ￥
            </template>
          </n-input-number>
        </n-form-item>
        <n-form-item
          label="库存"
        >
          <n-input v-model:value="modalForm.stock" disabled class="w-full" placeholder="库存根据商品规格自动计算" />
        </n-form-item>
      </n-form>
      <n-alert v-if="modalAction === 'add'" type="warning" closable>
        新创建商品默认状态为启用
      </n-alert>
    </MeModal>

    <n-modal v-model:show="state.showModal" preset="card">
      <img :src="state.previewImage" class="w-full">
    </n-modal>
  </CommonPage>
</template>

<script setup>
import { NAvatar, NButton, NSwitch, NTag } from 'naive-ui'
import { MeCrud, MeModal, MeQueryItem } from '@/components'
import { useCrud } from '@/composables'
import { withPermission } from '@/directives'
import { formatDateTime } from '@/utils'
import api from './api'

defineOptions({ name: 'ProductList' })

const $table = ref(null)
/** QueryBar筛选参数（可选） */
const queryItems = ref({})

const state = reactive({
  showModal: false,
  previewImage: '',
  previewFileList: [],
})

onMounted(() => {
  $table.value?.handleSearch()
})

const genders = [
  { label: '男', value: 1 },
  { label: '女', value: 2 },
]

function handlePreview(file) {
  state.showModal = true
  state.previewImage = file.url
}

const {
  modalRef,
  modalFormRef,
  modalForm,
  modalAction,
  handleAdd,
  handleDelete,
  handleOpen,
  handleSave,
} = useCrud({
  name: '商品',
  initForm: { enable: true },
  doCreate: api.create,
  doDelete: api.delete,
  doUpdate: api.update,
  refresh: () => $table.value?.handleSearch(),
})

const columns = [
  {
    title: '商品名称',
    key: 'name',
    width: 150,
    ellipsis: { tooltip: true },
  },
  {
    title: '商品图片',
    key: 'image',
    width: 150,
    render: ({ image }) =>
      h(NAvatar, {
        size: 'medium',
        src: image,
      }),
  },
  {
    title: '销售价格',
    key: 'price',
    width: 150,
  },
  {
    title: '成本价格',
    key: 'costPrice',
    width: 150,
  },
  {
    title: '销量',
    key: 'sales',
    width: 150,
  },
  {
    title: '库存',
    key: 'stock',
    width: 150,
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 180,
  },
  {
    title: '状态',
    key: 'enable',
    width: 120,
    render: row =>
      h(
        NSwitch,
        {
          size: 'small',
          rubberBand: false,
          value: row.enable,
          loading: !!row.enableLoading,
          onUpdateValue: () => handleEnable(row),
        },
        {
          checked: () => '启用',
          unchecked: () => '停用',
        },
      ),
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    align: 'right',
    fixed: 'right',
    hideInExcel: true,
    render(row) {
      return [
        withPermission(
          h(NButton, {
            size: 'small',
            type: 'primary',
            secondary: true,
          }, {
            default: () => '超管专属',
            icon: () => h('i', { class: 'i-carbon:user-role text-14' }),
          }),
          'SuperAdmin',
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            class: 'ml-12px',
            secondary: true,
            onClick: () => handleOpenRolesSet(row),
          },
          {
            default: () => '分配角色',
            icon: () => h('i', { class: 'i-carbon:user-role text-14' }),
          },
        ),
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            style: 'margin-left: 12px;',
            onClick: () => handleOpen({ action: 'reset', title: '重置密码', row, onOk: onSave }),
          },
          {
            default: () => '重置密码',
            icon: () => h('i', { class: 'i-radix-icons:reset text-14' }),
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
  row.enableLoading = true
  try {
    await api.update({ id: row.id, enable: !row.enable })
    row.enableLoading = false
    $message.success('操作成功')
    $table.value?.handleSearch()
  }
  catch (error) {
    console.error(error)
    row.enableLoading = false
  }
}

function handleOpenRolesSet(row) {
  const roleIds = row.roles.map(item => item.id)
  handleOpen({
    action: 'setRole',
    title: '分配角色',
    row: { id: row.id, username: row.username, roleIds },
    onOk: onSave,
  })
}

function onSave() {
  if (modalAction.value === 'setRole') {
    return handleSave({
      api: () => api.update(modalForm.value),
      cb: () => $message.success('分配成功'),
    })
  }
  else if (modalAction.value === 'reset') {
    return handleSave({
      api: () => api.resetPwd(modalForm.value.id, modalForm.value),
      cb: () => $message.success('密码重置成功'),
    })
  }
  handleSave()
}
</script>
