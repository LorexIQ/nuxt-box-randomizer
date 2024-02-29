type IconsInnerType = { [name: string]: string };
const prepareIconsType = <T extends IconsInnerType>(config: T): T => config;

const icons = prepareIconsType({
    Plus: 'ic:round-plus',
    Bin: 'mingcute:delete-fill',
    Handle: 'gg:menu-grid-o',
    Box: 'system-uicons:box',
    BoxOpen: 'system-uicons:box-open',
    Pen: 'solar:pen-bold',
    Info: 'akar-icons:info',
    BoxesDelete: 'fluent:box-dismiss-20-regular',
    Restart: 'solar:restart-outline',
    Times: 'uil:times'
});

export type IconsType = keyof typeof icons;
export default icons;
