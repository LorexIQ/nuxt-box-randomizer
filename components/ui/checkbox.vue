<script setup lang="ts" generic="T extends CheckboxState">
type CheckboxState = boolean | 1 | 0 | 'on' | 'off';

interface Props {
  id: number | string;
  modelValue?: T;
  isRounded?: boolean;
  title?: string;
  disabled?: boolean;
}
interface Emit {
  (e: 'update:modelValue', state: T): void;
  (e: 'change', state: T): void;
  (e: 'check', state: T): void;
  (e: 'uncheck', state: T): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
});
const emit = defineEmits<Emit>();

const innerValue = ref(getValueWithType(props.modelValue ?? false as T));

watch(() => props.modelValue, (value, oldValue) => {
  if (innerValue.value !== getValueWithType(value!) && oldValue !== undefined) {
    innerValue.value = value!;
  }
});

function getValueWithType(value: T): boolean {
  const isNumber = typeof value === 'number';
  const isString = typeof value === 'string';

  return isNumber ? Boolean(value) : isString ? value === 'on' : value;
}
function changeEventHandler(event: InputEvent) {
  const modelValue = props.modelValue as T;
  const value = innerValue.value;

  const target = event.target as HTMLInputElement;
  const isNumber = typeof modelValue === 'number';
  const isString = typeof modelValue === 'string';

  const returnedValue = (isNumber ? Number(value) : isString ? `${value ? 'on' : 'off'}` : value) as T;

  emit('update:modelValue', returnedValue);
  emit('change', returnedValue);
  if (target.checked) emit('check', returnedValue);
  else emit('uncheck', returnedValue);
}
</script>

<template>
  <div
      class="checkbox"
      :class="{
        '--disabled': disabled,
        '--radio': isRounded
      }"
  >
    <input
        :id="id"
        type="checkbox"
        v-model="innerValue"
        @change="changeEventHandler"
    >
    <label
        :for="id"
        class="checkbox__check"
    >
      <span :style="{'opacity': innerValue ? 1 : 0}"/>
    </label>
    <label
        v-if="title"
        :for="id"
        class="checkbox__title"
    >
      <span>{{ title }}</span>
    </label>
  </div>
</template>

<style lang="scss" scoped>
.checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  transition: .3s;

  & input {
    display: none;
  }
  &__check {
    display: block;
    width: 20px;
    height: 20px;
    min-width: 20px;
    min-height: 20px;
    padding: 3px;
    border: 1px solid #dfdfdf;;
    border-radius: 5px;
    cursor: pointer;
    user-select: none;

    & span {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 3px;
      background-color: #41d15e;
      opacity: 0;
      transition: .3s;
    }
  }
  &__title {
    padding: 2px 4px;
    opacity: .75;
    cursor: pointer;
    user-select: none;
  }
  &.--disabled {
    pointer-events: none;

    & .checkbox {
      &__check {
        background-color: #686868;
      }
    }
  }
  &.--radio {
    & label {
      border-radius: 100%;

      & span {
        border-radius: 100%;
      }
    }
  }
}
</style>
