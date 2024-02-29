<script lang="ts" setup>
const route = useRoute();
const router = useRouter();
const boxesStore = useBoxesStore();

const isEdit = !!route.query.edit;

function deleteAllBoxes() {
  if (!confirm('Вы уверены, что хотите удалить все коробки?')) return;
  boxesStore.deleteAllBoxes();
}
function cleanResults() {
  if (!confirm('Вы уверены, что хотите очистить результаты?')) return;
  boxesStore.cleanAllResults();
}
function closeEdit() {
  if (!confirm('Вы уверены, что хотите выйти из редактора?')) return;
  router.push({ path: '/' });
  setTimeout(() => location.reload(), 100);
}
</script>

<template>
  <div class="app">
    <frame-boxes/>
    <div
        class="results"
        :class="{'results--edit': isEdit}"
    >
      <div class="results__header">
        <div class="wrap">
          <h2>{{ isEdit ? 'Редактор' : 'Результаты' }}</h2>
          <div class="results__header__actions">
            <div
                class="results__header__actions__button"
                :class="{'results__header__actions__button--disabled': !boxesStore.boxes.length}"
                @click="deleteAllBoxes"
            >
              <ui-icon
                  size="24px"
                  icon="BoxesDelete"
              />
            </div>
            <div
                class="results__header__actions__button"
                :class="{'results__header__actions__button--disabled': !boxesStore.results.length}"
                v-if="!isEdit"
                @click="cleanResults"
            >
              <ui-icon
                  size="24px"
                  icon="Restart"
              />
            </div>
            <div
                class="results__header__actions__button"
                v-if="isEdit"
                @click="closeEdit"
            >
              <ui-icon
                  size="24px"
                  icon="Times"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="results__content">
        <div
            class="results__content__row"
            :class="{'results__content__row--bold': !index}"
            v-for="(row, index) in boxesStore.results"
            :key="row.id"
        >
          {{ boxesStore.getTitleByResult(row) }}
        </div>
        <div
            class="results__content__null"
            v-if="!boxesStore.results.length"
        >
          Пусто
        </div>
      </div>
    </div>
  </div>
</template>


<style lang="scss" scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.boxes {
  flex-grow: 1;
}
.results {
  position: relative;
  height: 33%;
  overflow: hidden;

  &:after {
    position: absolute;
    bottom: 0;
    content: '';
    width: 100%;
    height: calc(100% - 50px);
    background: linear-gradient(0deg, rgba(249,249,249,1) 0%, rgba(249,249,249,0) 100%);
    pointer-events: none;
  }

  &__header {
    height: 50px;
    background-color: #fbfbfb;
    box-shadow: 0 0 10px #e5e4e4;
    user-select: none;

    & > div {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
    }

    &__actions {
      display: flex;
      align-items: center;
      gap: 10px;

      &__button {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 36px;
        height: 36px;
        border-radius: 5px;
        box-shadow: 0 0 6px #e5e4e4;
        cursor: pointer;
        transition: .3s;

        & svg {
          opacity: .8;
        }

        &:hover {
          box-shadow: 0 0 0 #e5e4e4;
          transform: scale(.98);
        }
        &:active {
          box-shadow: 0 0 1px #e5e4e4 inset;
          transform: scale(.95);
        }

        &--disabled {
          box-shadow: 0 0 0 #e5e4e4;
          opacity: .3;
          pointer-events: none;
        }
      }
    }
  }
  &__content {
    max-height: calc(100% - 50px);
    padding: 15px 0 70px;
    overflow: auto;
    text-align: center;

    &__row {
      font-size: 18px;
      padding: 6px 0;

      &--bold {
        font-weight: 600;
        font-size: 24px;
      }
    }
    &__null {
      font-size: 30px;
      font-weight: 600;
      padding: 8px 0;
      opacity: .3;
    }
  }

  &--edit {
    height: 50px;
  }
}
</style>
