<script setup lang="ts">
import draggable from "vuedraggable";
import type {BlackBoxCreate, BlackBoxType} from "~/stores/useBoxesStore";
import type {UseSwitch} from "~/composables/useSwitch";

interface Props {
  modelValue: UseSwitch;
  extended?: boolean;
}
interface Emits {
  (e: 'create', v: BlackBoxCreate): void
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const modal = props.modelValue;

let idIndent = 0;
const createBoxData = reactive<BlackBoxCreate>({
  title: '',
  random: true,
  content: []
});
const isDataCorrect = computed(() => createBoxData.title.length && createBoxData.content.every(el => el.title.length));

watch(modal.status, value => {
  if (!value) {
    idIndent = 0;
    createBoxData.title = '';
    createBoxData.random = true;
    createBoxData.content.splice(0);
  }
});

function addContent() {
  const content = createBoxData.content;
  const newId = idIndent++;

  content.push({
    id: newId,
    title: `Content #${newId}`
  });
}
function deleteContent(id: number) {
  const content = createBoxData.content;
  content.splice(content.findIndex(el => el.id === id), 1);
}
function createBox() {
  emit('create', JSON.parse(JSON.stringify(createBoxData)));
  modal.hide();
}
</script>

<template>
  <ui-modal v-model="modal">
    <div class="modal-create">
      <div class="modal-create__header">
        <h2>Создание коробки</h2>
        <ui-button
            :disabled="!isDataCorrect"
            decor="green"
            @click="createBox"
        >
          Создать
        </ui-button>
      </div>
      <div class="modal-create__data">
        <ui-input
            id="name"
            title="Название"
            placeholder="Минимум 1 символ"
            v-model="createBoxData.title"
        />
        <ui-checkbox
            v-if="extended"
            id="is-random"
            title="Случайное выпадение"
            v-model="createBoxData.random"
        />
        <div class="modal-create__data__content-header">
          <h3>Содержание</h3>
          <ui-icon
              size="24px"
              icon="Plus"
              @click="addContent"
          />
        </div>
        <draggable
            v-if="createBoxData.content.length"
            :list="createBoxData.content"
            item-key="id"
            class="modal-create__data__content"
            ghost-class="modal-create__data__content__row--ghost"
            handle=".modal-create__data__content__row__handle"
        >
          <template #item="{ element }">
            <div class="modal-create__data__content__row">
              <div
                  class="modal-create__data__content__row__handle"
                  v-if="extended"
              >
                <ui-icon
                    icon="Handle"
                    size="22px"
                />
              </div>
              <div class="modal-create__data__content__row__title">
                <ui-input
                    :id="element.id"
                    placeholder="Минимум 1 символ"
                    v-model="element.title"
                />
              </div>
              <div class="modal-create__data__content__row__delete">
                <ui-icon
                    icon="Bin"
                    size="18px"
                    @click="deleteContent(element.id)"
                />
              </div>
            </div>
          </template>
        </draggable>
        <div v-else>
          <div class="modal-create__data__content--null">
            Список пуст
          </div>
        </div>
      </div>
    </div>
  </ui-modal>
</template>

<style lang="scss">
.modal-create__data__content__row__title {
  & .ui-input input {
    padding: 6px 10px;
    border-radius: 8px;
  }
}
</style>
<style scoped lang="scss">
.modal-create {
  padding: 10px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__data {
    margin-top: 10px;
    padding: 10px;

    & .checkbox {
      margin-top: 5px;
    }
    &__content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;

      & svg {
        color: #2fc813;
        cursor: pointer;
      }
    }
    &__content {
      max-height: calc(100vh - 180px);
      padding-top: 5px;
      overflow: auto;

      &__row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 8px;

        &__handle {
          cursor: pointer;
        }
        &__title {
          flex-grow: 1;
        }
        &__delete {
          color: #f81124;
          cursor: pointer;
          transition: .3s;

          &:hover {
            opacity: .8;
          }
        }

        &--ghost {
          opacity: .3;
        }
      }

      &--null {
        text-align: center;
        opacity: .3;
      }
    }
  }
}
</style>
