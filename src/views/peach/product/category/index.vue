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
      <MeQueryItem label="分类名称" :label-width="70">
        <n-input
          v-model:value="queryItems.name"
          type="text"
          placeholder="请输入分类名称"
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
          label="分类名称"
          path="name"
          :rule="{
            required: true,
            message: '请输入分类名称',
            trigger: ['input', 'blur'],
          }"
        >
          <n-input v-model:value="modalForm.name" clearable />
        </n-form-item>
        <n-form-item label="分类图标">
          <n-upload :default-file-list="state.previewFileList" list-type="image-card" @preview="handlePreview" />
        </n-form-item>
        <n-form-item label="所属分类" path="parentId" :rule="{ required: true, message: '请选择所属分类', trigger: ['change', 'blur'] }">
          <n-tree-select v-model:value="modalForm.parentId" :options="state.parentOptions" label-field="name" key-field="id" />
        </n-form-item>
        <n-form-item label="分类图片">
          <n-upload :default-file-list="state.previewFileList" list-type="image-card" @preview="handlePreview" />
        </n-form-item>
        <n-form-item label="排序">
          <n-input-number v-model:value="modalForm.sort" class="w-full" placeholder="请输入排序" :default-value="0" />
        </n-form-item>
        <n-form-item label="显示状态">
          <NSwitch v-model:value="modalForm.showInNav" :checked-value="1" :unchecked-value="0" :default-value="1">
            <template #checked>
              显示
            </template>
            <template #unchecked>
              隐藏
            </template>
          </NSwitch>
        </n-form-item>
        <n-form-item label="状态">
          <NSwitch v-model:value="modalForm.status" :checked-value="1" :unchecked-value="0" :default-value="1">
            <template #checked>
              启用
            </template>
            <template #unchecked>
              停用
            </template>
          </NSwitch>
        </n-form-item>
      </n-form>
      <n-alert v-if="modalAction === 'add'" type="warning" closable>
        新增分类显示状态默认显示，状态默认启用，排序默认 0
      </n-alert>
    </MeModal>

    <n-modal v-model:show="state.showModal" preset="card">
      <img :src="state.previewImage" class="w-full">
    </n-modal>
  </CommonPage>
</template>

<script setup>
import { NAvatar, NButton, NIcon, NImage, NSwitch, NTag } from 'naive-ui'
import { h } from 'vue'
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
  parentOptions: [],
})

onMounted(async () => {
  $table.value?.handleSearch()

  const { data } = await api.readTree()
  recurseOptions(data)
  state.parentOptions.unshift({
    id: '-1',
    name: '根分类',
    children: data,
  })
})

function recurseOptions(options) {
  options.forEach((item) => {
    item.children = item.children.length > 0 ? recurseOptions(item.children) : null
  })
  return options
}

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
  handleEdit,
} = useCrud({
  name: '分类',
  initForm: { },
  doCreate: api.create,
  doDelete: api.delete,
  doUpdate: (data) => {
    if (data.parentId === '-1') {
      data.parentId = null
    }
    return api.update(data)
  },
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
    key: 'icon',
    width: 90,
    render: ({ icon }) => {
      if (icon) {
        return h(NAvatar, {
          size: 'medium',
          src: icon,
          class: 'rounded-full',
        }, {
          fallback: () => h('span', {
            class: '-translate-x-1/2 -translate-y-1/2 scale-100 inline-block absolute top-1/2 left-1/2',
          }, '无'),
        })
      }
      else {
        return h(NAvatar, {
          size: 'medium',
          src: icon,
          class: 'rounded-full',
        }, {
          default: () => '无',
        })
      }
    },
  },
  {
    title: '分类图片',
    key: 'image',
    width: 90,
    render: ({ image }) =>
      h(NImage, {
        size: 'medium',
        src: image,
      }, {
        placeholder: () => h('i', { class: 'i-ion:image-outline text-32' }),
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
      return h('span', formatDateTime(row.createTime))
    },
  },
  {
    title: '更新时间',
    key: 'updateTime',
    width: 180,
    render(row) {
      return h('span', formatDateTime(row.updateTime))
    },
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
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            onClick: () => {
              row.parentId = row.parentId ? row.parentId : '-1'
              handleEdit(row)
            },
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
</script>
