<script setup lang="ts">
import type {BlackBoxResult, BlackBoxType} from "~/stores/useBoxesStore";
import type {UseSwitch} from "~/composables/useSwitch";

interface Props {
  data: BlackBoxType;
  results: BlackBoxResult[];
  modelValue: UseSwitch;
}
interface Emits {
  (e: 'drop', v: number): void;
  (e: 'clean', v: number): void;
  (e: 'delete', v: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const modal = props.modelValue;

const infoBoxData = reactive<BlackBoxType>(props.data ?? {});
const currentResults = computed(() => props.results.filter(result => result.boxId === infoBoxData.id));
const contentObject = computed(() => infoBoxData.content?.reduce((accum, current) => {
  accum[current.id] = current.title;
  return accum;
}, {} as { [name: number]: string }));

watch(props.data, value => {
  Object.assign(infoBoxData, value);
});

function deleteBox() {
  if (!confirm('Вы уверены?')) return;
  emit('delete', infoBoxData.id);
  modal.hide();
}
</script>

<template>
  <ui-modal v-model="modal">
    <div class="modal-info">
      <div class="modal-info__header">
        <h2>Информация о коробке</h2>
      </div>
      <div class="modal-info__data">
        <ui-input
            id="name"
            title="Название"
            disabled
            placeholder="Минимум 1 символ"
            v-model="infoBoxData.title"
        />
        <div class="table">
          <div class="table__column">
            <div class="table__column__header">Содержание</div>
            <div class="table__column__content">
              <div
                  class="table__column__content__row"
                  :class="{'table__column__content__row--has': currentResults.find(result => result.contentId === row.id)}"
                  v-if="data.content.length"
                  v-for="row in data.content"
                  :key="row.id"
              >
                {{ row.title }}
              </div>
              <div
                  class="table__column__content__row table__column__content__row--null"
                  v-else
              >
                Пусто
              </div>
            </div>
          </div>
          <div class="table__column">
            <div class="table__column__header">Выпадения</div>
            <div class="table__column__content">
              <div
                  class="table__column__content__row"
                  :class="{'table__column__content__row--bold': !index}"
                  v-if="currentResults.length"
                  v-for="(row, index) in currentResults"
                  :key="row"
              >
                {{ contentObject[row.contentId] }}
              </div>
              <div
                  class="table__column__content__row table__column__content__row--null"
                  v-else
              >
                Пусто
              </div>
            </div>
          </div>
        </div>
        <div class="modal-info__data__actions">
          <ui-button
              decor="red"
              @click="deleteBox"
          >
            Удалить
          </ui-button>
          <ui-button
              decor="green"
              :disabled="infoBoxData.content.length === currentResults.length"
              @click="emit('drop', infoBoxData.id)"
          >
            Крутить
          </ui-button>
          <ui-button
              :disabled="!currentResults.length"
              @click="emit('clean', infoBoxData.id)"
          >
            Очистить
          </ui-button>
        </div>
      </div>
    </div>
  </ui-modal>
</template>

<style scoped lang="scss">
.modal-info {
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
    &__actions {
      display: flex;
      gap: 5px;
      width: 100%;
      margin-top: 10px;

      & .ui-button {
        flex-grow: 1;
        justify-content: center;
      }
    }
  }
}

.table {
  display: flex;
  margin-top: 10px;
  border: 1px solid #dfdfdf;
  border-radius: 10px;
  overflow: hidden;

  &__column {
    width: 50%;

    &__header {
      font-weight: 600;
      padding: 8px 10px;
      border-bottom: 1px solid #dfdfdf;
      background-color: #fbfbfb;
    }
    &__content {
      &__row {
        padding: 4px 10px;

        &--has {
          text-decoration: line-through;
          opacity: .5;
        }
        &--bold {
          font-weight: 600;
        }
        &--null {
          opacity: .5;
        }
      }
    }

    &:last-child {
      border-left: 1px solid #dfdfdf;
    }
  }
}
</style>
