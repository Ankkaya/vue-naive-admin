<template>
  <CommonPage back>
    <template #action>
      <NButton type="primary" @click="handleAdd()">
        <i class="i-material-symbols:add mr-4 text-18" />
        保存
      </NButton>
    </template>
    <n-alert v-if="state.modalAction === 'add'" class="mb-20" type="warning" closable>
      新创建商品默认状态为启用
    </n-alert>
    <n-form
      ref="modalFormRef" label-placement="left" label-align="left" :label-width="80" :model="state.modalForm"
      :disabled="state.modalAction === 'view'"
    >
      <n-form-item
        label="商品名称" path="name" :rule="{
          required: true,
          message: '请输入商品名称',
          trigger: ['input', 'blur'],
        }"
      >
        <NInput v-model:value="state.modalForm.name" clearable />
      </n-form-item>
      <n-form-item label="商品图片">
        <n-upload :default-file-list="state.previewFileList" list-type="image-card" @preview="handlePreview" />
      </n-form-item>
      <n-form-item
        label="销售价格" path="price" :rule="{
          type: 'number',
          required: true,
          message: '请输入销售价格',
          trigger: ['change', 'blur'],
        }"
      >
        <NInputNumber v-model:value="state.modalForm.price" class="w-full" :precision="2" placeholder="请输入销售价格">
          <template #prefix>
            ￥
          </template>
        </NInputNumber>
      </n-form-item>
      <n-form-item
        label="成本价格" path="costPrice" :rule="{
          type: 'number',
          required: true,
          message: '请输入成本价格',
          trigger: ['change', 'blur'],
        }"
      >
        <NInputNumber v-model:value="state.modalForm.costPrice" class="w-full" :precision="2" placeholder="请输入成本价格">
          <template #prefix>
            ￥
          </template>
        </NInputNumber>
      </n-form-item>
      <n-form-item label="状态">
        <NSwitch v-model:value="state.modalForm.status" :checked-value="1" :unchecked-value="0">
          <template #checked>
            启用
          </template>
          <template #unchecked>
            停用
          </template>
        </NSwitch>
      </n-form-item>
      <n-form-item label="规格">
        <n-radio-group v-model:value="state.modalForm.specType" @update:value="handleSpecTypeChange">
          <n-space>
            <n-radio :value="1">
              单规格
            </n-radio>
            <n-radio :value="2">
              多规格
            </n-radio>
          </n-space>
        </n-radio-group>
      </n-form-item>
      <n-button v-if="state.modalForm.specType === 2" type="primary" class="ml-80" @click="handleAddAttribute">
        添加规格
      </n-button>
      <n-data-table
        v-if="state.modalForm.specType === 1 || (state.modalForm.specType === 2 && state.columns.length > 0)"
        :class="state.modalForm.specType === 2 ? 'mt-20' : ''" bordered
        :columns="state.columns" :data="state.specList"
      />
    </n-form>
    <n-modal v-model:show="state.showModal" preset="card">
      <img :src="state.previewImage" class="w-full">
    </n-modal>

    <n-modal class="w-800"  title="商品规格" v-model:show="state.showAttributeModal" preset="card" @close="state.showAttributeModal = false">
        <n-data-table v-model:checked-row-keys="state.checkedRowKeys" :max-height="650" :columns="state.attributeColumns" :data="state.attributeData" :row-key="state.rowKey" @update:checked-row-keys="handleCheckedRowKeys" />
        <template #footer >
          <div class="flex justify-end">
            <n-button  @click="state.showAttributeModal = false">关闭</n-button>
          </div>
        </template>
    </n-modal>
  </CommonPage>
</template>

<script setup>
import { NInput, NInputNumber } from 'naive-ui'
import { h } from 'vue'
import attributeApi from '@/views/peach/product/attribute/api'

defineOptions({ name: 'ProductDetail' })

const route = useRoute()
const modalFormRef = ref(null)

const state = reactive({
  previewImage: '',
  previewFileList: [],
  attributeData: [],
  attributeOptions: [],
  attributeColumns: [{
    type: 'selection',
  }, {
    title: '规格名称',
    key: 'name',
  }, {
    title: '规格值',
    key: 'attributeValues',
  }],
  pagination: {
    page: 1,
    pageSize: 100,
    showSizePicker: true,
    pageSizes: [10, 20, 50, 100],
    showQuickJumper: true,
    showTotal: true,
    onChange: (page) => {
      state.pagination.page = page
    },
    onUpdatePageSize(pageSize) {
      state.pagination.pageSize = pageSize
      state.pagination.page = 1
    },
  },
  rowKey: row => row.attributeValueId,
  checkedRowKeys: [],
  modalForm: {
    specType: 2,
    status: 1,
  },
  modalAction: 'add',
  showModal: false,
  showAttributeModal: false,
  specList: [],
  columns: [],
})

function handlePreview(file) {
  state.showModal = true
  state.previewImage = file.url
}

function generateSkuCombinations2(attributes) {
  const results = []

  function combine(current, index) {
    if (index === attributes.length) {
      current.stock = 0
      results.push({ ...current })
      return
    }

    const attr = attributes[index]
    for (const value of attr.attributeValues) {
      current[attr.name] = value.value
      combine(current, index + 1)
    }
  }

  combine({}, 0)
  return results
}

function handleAttributeChecked() {
  if (state.attributeOptions.length === 0) {
    state.columns = []
    state.specList = []
    return
  }

  state.columns = state.attributeOptions.map(item => ({
    title: item.name,
    key: item.name,
    width: 100,
  }))
  if (state.attributeOptions.length > 0) {
    state.columns.push({
      title: '库存',
      key: 'stock',
      width: 100,
      render(row, index) {
        return h(NInputNumber, {
          value: row.stock,
          min: 0,
          onUpdateValue(v) {
            state.specList[index].stock = v
          },
        })
      },
    })
  }

  // 根据 state.attributeOptions 中每个属性的 attributeValues 列表，交叉生成 specList
  state.specList = generateSkuCombinations2(state.attributeOptions)
}

function handleSpecTypeChange(value) {
  if (value === 1) {
    state.specList = [{
      default: '默认',
      stock: 0,
    }]
    state.columns = [{
      title: '规格',
      key: 'default',
      width: 100,
    }, {
      title: '库存',
      key: 'stock',
      width: 100,
      render(row, index) {
        return h(NInput, {
          value: row.stock,
          onUpdateValue(v) {
            state.specList[index].stock = v
          },
        })
      },
    }]
  }
  else {
    state.columns = []
    state.specList = []
    state.attributeOptions = []
  }
}

function handleCheckedRowKeys(value, rows, meta) {
  state.checkedRowKeys = value

  // 判断 meta.action 状态，如果是 checkAll
  if (meta.action === 'checkAll') {
    state.attributeOptions = state.rawAttributeData
  }

  // 如果是 uncheckAll
  if (meta.action === 'uncheckAll') {
    state.attributeOptions = []
  }

  // if is uncheck
  if(meta.action === 'uncheck') {
    const index = state.attributeOptions.findIndex(item => item.id === meta.row.id)
    // find meta.row.attributeValueId in state.attributeOptions[index].attributeValues
    const attributeValueIndex = state.attributeOptions[index].attributeValues.findIndex(item => item.id === meta.row.attributeValueId)
    // delete state.attributeOptions[index].attributeValues[attributeValueIndex]
    state.attributeOptions[index].attributeValues.splice(attributeValueIndex, 1)
  }

  // if is check
  if(meta.action === 'check') {
    const index = state.attributeOptions.findIndex(item => item.id === meta.row.id)
    // if index > - 1，there is attributeValues in state.attributeOptions[index]
    if (index > -1) {
      // push meta.row into state.attributeOptions[index].attributeValues
      state.attributeOptions[index].attributeValues.push({
        id: meta.row.attributeValueId,
        value: meta.row.attributeValues,
      })
    } else {
      state.attributeOptions.push({
        id: meta.row.id,
        name: meta.row.name,
        attributeValues: [{
          id: meta.row.attributeValueId,
          value: meta.row.attributeValues,
        }],
      })
    }
  }

  // traverse state.attributeOptions, delete item.attributeValues if item.attributeValues.length === 0
  state.attributeOptions = state.attributeOptions.filter(item => item.attributeValues.length > 0)

  handleAttributeChecked()
}

function handleAddAttribute() {
  state.showAttributeModal = true
  getAttributeData()
}

async function getAttributeData() {
  const { data } = await attributeApi.read({ status: 1, valueStatus: 1, page: state.pagination.page, limit: state.pagination.pageSize })
  state.rawAttributeData = data.pageData
  const result = []
  data.pageData.reduce((acc, item) => {
    const list = item.attributeValues.map(sitem => ({
      id: item.id,
      name: item.name,
      attributeValues: sitem.value,
      attributeValueId: sitem.id,
    }))
    acc.push(...list)
    return acc
  }, result)
  state.attributeData = result
}

onMounted(async () => {

})
</script>
