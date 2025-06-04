<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleAdd()">
        <i class="i-material-symbols:add mr-4 text-18" />
        新增分类
      </NButton>
    </template>

    <MeCrud
      ref="$table"
      v-model:query-items="queryItems"
      :scroll-x="1680"
      :columns="columns"
      :get-data="api.readTree"
    >
      <MeQueryItem label="分类名称" :label-width="50">
        <n-input
          v-model:value="queryItems.username"
          type="text"
          placeholder="请输入用户名"
          clearable
        />
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
    title: '分类名称',
    key: 'name',
    width: 150,
    ellipsis: { tooltip: true },
  },
  {
    title: '分类图标',
    key: 'image',
    width: 90,
    render: ({ image }) =>
      h(NAvatar, {
        size: 'medium',
        src: image,
        class: 'rounded-full display-block justify-center items-center',
        renderFallback: () => h('i', { class: 'i-material-symbols:image-not-supported-outline text-22' }),
      }),
  },
  {
    title: '分类图片',
    key: 'image',
    width: 90,
    render: ({ image }) =>
      h(NAvatar, {
        size: 'medium',
        src: image,
      }),
  },
  {
    title: '显示状态',
    key: 'showInNav',
    width: 90,
    render: row =>
      h(
        NSwitch,
        {
          size: 'small',
          rubberBand: false,
          value: row.showInNav,
          loading: !!row.loading,
          onUpdateValue: () => handleEnable('showInNav', row),
        },
        {
          checked: () => '显示',
          unchecked: () => '隐藏',
        },
      ),
  },
  {
    title: '状态',
    key: 'status',
    width: 90,
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
          onUpdateValue: () => handleEnable('status', row),
        },
        {
          checked: () => '启用',
          unchecked: () => '停用',
        },
      ),
  },
  {
    title: '排序',
    key: 'sort',
    width: 90,
  },
  {
    title: '创建时间',
    key: 'createTime',
    width: 180,
    render(row) {
      return h('span', formatDateTime(row.createdAt))
    },
  },
  {
    title: '更新时间',
    key: 'updateTime',
    width: 180,
    render(row) {
      return h('span', formatDateTime(row.updatedAt))
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 70,
    align: 'right',
    fixed: 'right',
    hideInExcel: true,
    render(row) {
      return [
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

async function handleEnable(type, row) {
  row.loading = true
  try {
    if (type === 'status') {
      await api.updateStatus({ id: row.id, status: row.status === 1 ? 0 : 1 })
    }
    else if (type === 'showInNav') {
      await api.updateShowInNav({ id: row.id, showInNav: !row.showInNav })
    }

    row.loading = false
    $message.success('操作成功')
    $table.value?.handleSearch()
  }
  catch (error) {
    console.error(error)
    row.enableLoading = false
  }
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
