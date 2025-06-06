<template>
  <CommonPage back>
    <template #action>
      <NButton type="primary" @click="handleAdd()">
        <i class="i-material-symbols:add mr-4 text-18" />
        保存
      </NButton>
    </template>
    <n-alert class="mb-20" v-if="state.modalAction === 'add'" type="warning" closable>
      新创建商品默认状态为启用
    </n-alert>
    <n-form ref="modalFormRef" label-placement="left" label-align="left" :label-width="80" :model="state.modalForm"
      :disabled="state.modalAction === 'view'">
      <n-form-item label="商品名称" path="name" :rule="{
        required: true,
        message: '请输入商品名称',
        trigger: ['input', 'blur'],
      }">
        <NInput v-model:value="state.modalForm.name" clearable />
      </n-form-item>
      <n-form-item label="商品图片">
        <n-upload :default-file-list="state.previewFileList" list-type="image-card" @preview="handlePreview" />
      </n-form-item>
      <n-form-item label="销售价格" path="price" :rule="{
        type: 'number',
        required: true,
        message: '请输入销售价格',
        trigger: ['change', 'blur'],
      }">
        <n-input-number v-model:value="state.modalForm.price" class="w-full" :precision="2" placeholder="请输入销售价格">
          <template #prefix>
            ￥
          </template>
        </n-input-number>
      </n-form-item>
      <n-form-item label="成本价格" path="costPrice" :rule="{
        type: 'number',
        required: true,
        message: '请输入成本价格',
        trigger: ['change', 'blur'],
      }">
        <n-input-number v-model:value="state.modalForm.costPrice" class="w-full" :precision="2" placeholder="请输入成本价格">
          <template #prefix>
            ￥
          </template>
        </n-input-number>
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
      <div v-if="state.modalForm.specType === 2" class="ml-80">
        <n-space>
          <n-tag v-for="item in state.attributeOptions" :key="item.id" :checked="item.checked" checkable size="large"
            @update:checked="(value) => handleAttributeChecked(value, item)">
            {{ item.name }}
          </n-tag>
        </n-space>
      </div>
      <n-data-table :class="state.modalForm.specType === 2 ? 'mt-20' : ''"
        v-if="state.modalForm.specType === 1 || (state.modalForm.specType === 2 && state.columns.length > 0)" bordered
        :columns="state.columns" :data="state.specList" />
    </n-form>
    <n-modal v-model:show="state.showModal" preset="card" />
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
  attributeOptions: [],
  modalForm: {
    specType: 2,
    status: 1
  },
  modalAction: 'add',
  showModal: false,
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

function handleAttributeChecked(value, item) {
  item.checked = value
  // 从state.attributeOptions中找到checked为true的属性
  const checkedAttributes = state.attributeOptions.filter(item => item.checked)

  // 根据 checkedAttributes 中 name 设置 表头
  state.columns = checkedAttributes.map(item => ({
    title: item.name,
    key: item.name,
    width: 100,
  }))
  if (checkedAttributes.length > 0) {
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

  // 根据 checkedAttributes 中每个属性的 attributeValues 列表，交叉生成 specList
  state.specList = generateSkuCombinations2(checkedAttributes)
  console.log(state.specList)
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
    state.attributeOptions.forEach((item) => {
      item.checked = false
    })
  }
}

onMounted(async () => {
  const { data } = await attributeApi.readAll({ status: 1 })
  state.attributeOptions = data.map(item => ({
    ...item,
    checked: false,
  }))
})
</script>
