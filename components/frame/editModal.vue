<script setup lang="ts">
import draggable from "vuedraggable";
import type {BlackBoxType, BlackBoxUpdate} from "~/stores/useBoxesStore";
import type {UseSwitch} from "~/composables/useSwitch";

interface Props {
  data: BlackBoxType;
  modelValue: UseSwitch;
  extended?: boolean;
}
interface Emits {
  (e: 'save', v: BlackBoxUpdate): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const modal = props.modelValue;

let idIndent = props.data?.content?.length;
const editBoxData = reactive<BlackBoxType>(props.data ?? {});
const isDataCorrect = computed(() => editBoxData.title.length && editBoxData.content.every(el => el.title.length));

watch(props.data, value => {
  Object.assign(editBoxData, value);
  idIndent = value.content.length;
});

function addContent() {
  const content = editBoxData.content;
  const newId = idIndent++;

  content.push({
    id: newId,
    title: `Content #${newId}`
  });
}
function deleteContent(id: number) {
  const content = editBoxData.content;
  content.splice(content.findIndex(el => el.id === id), 1);
}
function saveBox() {
  emit('save', { ...editBoxData });
  modal.hide();
}
</script>

<template>
  <ui-modal v-model="modal">
    <div class="modal-edit">
      <div class="modal-edit__header">
        <h2>Редактирование коробки</h2>
        <ui-button
            :disabled="!isDataCorrect"
            decor="green"
            @click="saveBox"
        >
          Сохранить
        </ui-button>
      </div>
      <div class="modal-edit__data">
        <ui-input
            id="name"
            title="Название"
            placeholder="Минимум 1 символ"
            v-model="editBoxData.title"
        />
        <ui-checkbox
            v-if="extended"
            id="is-random"
            title="Случайное выпадение"
            v-model="editBoxData.random"
        />
        <div class="modal-edit__data__content-header">
          <h3>Содержание</h3>
          <ui-icon
              size="24px"
              icon="Plus"
              @click="addContent"
          />
        </div>
        <draggable
            v-if="editBoxData.content.length"
            :list="editBoxData.content"
            item-key="id"
            class="modal-edit__data__content"
            ghost-class="modal-edit__data__content__row--ghost"
            handle=".modal-edit__data__content__row__handle"
        >
          <template #item="{ element }">
            <div class="modal-edit__data__content__row">
              <div
                  class="modal-edit__data__content__row__handle"
                  v-if="extended"
              >
                <ui-icon
                    icon="Handle"
                    size="22px"
                />
              </div>
              <div class="modal-edit__data__content__row__title">
                <ui-input
                    :id="element.id"
                    placeholder="Минимум 1 символ"
                    v-model="element.title"
                />
              </div>
              <div class="modal-edit__data__content__row__delete">
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
          <div class="modal-edit__data__content--null">
            Список пуст
          </div>
        </div>
      </div>
    </div>
  </ui-modal>
</template>

<style lang="scss">
.modal-edit__data__content__row__title {
  & .ui-input input {
    padding: 6px 10px;
    border-radius: 8px;
  }
}
</style>
<style scoped lang="scss">
.modal-edit {
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
