<script setup lang="ts">
import type {BlackBoxType} from "~/stores/useBoxesStore";

interface Props {
  isEdit?: boolean;
  isContentNull?: boolean;
  modelValue: BlackBoxType;
}
interface Emits {
  (e: 'drop', v: number): void;
  (e: 'delete', v: number): void;
  (e: 'edit', v: number): void;
  (e: 'editExtended', v: number): void;
  (e: 'info', v: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function drop() {
  !props.isEdit && emit('drop', props.modelValue.id);
}
</script>

<template>
  <block-box-frame
      class="black-box"
      :class="{
        'black-box--edited': isEdit,
        'black-box--null': isContentNull,
      }"
      @click="drop"
  >
    <div class="black-box__box">
      <ui-icon
          :icon="isContentNull ? 'BoxOpen' : 'Box'"
          size="100px"
      />
    </div>
    <div class="black-box__title">
      {{ modelValue.title }}
    </div>
    <div
        class="black-box__null"
        v-if="isContentNull && !isEdit"
    >
      (Пусто)
    </div>
    <div
        class="black-box__info"
        v-if="!isEdit"
        @click.stop="emit('info', modelValue.id)"
    >
      <ui-icon icon="Info"/>
    </div>
    <div
        class="black-box__actions"
        v-if="isEdit"
    >
      <div
          class="black-box__actions__button"
          @click="emit('edit', modelValue.id)"
          @click.ctrl="emit('editExtended', modelValue.id)"
      >
        <ui-icon
            icon="Pen"
            size="20px"
        />
      </div>
      <div
          class="black-box__actions__button"
          @click="emit('delete', modelValue.id)"
      >
        <ui-icon
            icon="Bin"
            size="20px"
        />
      </div>
    </div>
  </block-box-frame>
</template>

<style lang="scss" scoped>
.black-box {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  user-select: none;

  &__box {
    color: #393939;
  }
  &__title {
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
  }
  &__actions {
    display: flex;
    width: 100%;
    min-height: 30px;
    margin-top: 5px;
    cursor: pointer;

    &__button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 50%;
      box-shadow: 0 0 6px #d8d7d7 inset;
      transition: .3s;

      &:first-child {
        color: #a2a2a2;
      }
      &:last-child {
        color: #de0012;
      }

      &:hover {
        box-shadow: 0 0 2px #d8d7d7 inset;
      }
    }
  }
  &__null {
    position: absolute;
    top: 106px;
    font-size: 12px;
  }
  &__info {
    position: absolute;
    top: 5px;
    right: 5px;
    opacity: .5;
    cursor: pointer;

    &:hover {
      opacity: 1;
    }
  }

  &--edited {
    padding: 0 !important;
    cursor: default;

    &:hover, &:active {
      box-shadow: 0 0 10px #e5e4e4;
      transform: none;
    }
  }
  &--null {
    opacity: .6;
    cursor: not-allowed;

    &:hover, &:active {
      box-shadow: 0 0 10px #e5e4e4;
      transform: none;
    }
  }
}
</style>
