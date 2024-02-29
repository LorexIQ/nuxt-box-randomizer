import type {Ref} from "vue";

export interface UseSwitchProps {
    defaultStatus?: boolean;
    minSwitchStatusDelay?: number;
}
export interface UseSwitch {
    show(): void;
    hide(): void;
    status: Ref<boolean>;
    delay: Readonly<number>;
}

export default function (config?: UseSwitchProps): UseSwitch {
    const currentStatus = ref(config?.defaultStatus ?? false);
    const minHideDelay = config?.minSwitchStatusDelay ?? 500;
    let showTimeStamp = 0;
    let hideDelay: NodeJS.Timeout;

    function show() {
        currentStatus.value = true;
        showTimeStamp = Date.now();
        clearTimeout(hideDelay);
    }
    function hide() {
        const delay = minHideDelay - (Date.now() - showTimeStamp);
        hideDelay = setTimeout(() => {
            currentStatus.value = false;
        }, delay < 0 ? 0 : delay);
    }

    return {
        show,
        hide,
        status: currentStatus,
        delay: minHideDelay
    };
}
