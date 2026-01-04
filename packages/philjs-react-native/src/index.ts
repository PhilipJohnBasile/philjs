
// Bridge for React Native components to PhilJS signals

export function usePhilSignal(signal: any) {
    // Mock useEffect/useState for React Native env
    /* 
     const [val, setVal] = React.useState(signal.value);
     React.useEffect(() => signal.subscribe(setVal), []);
     return val;
    */
    return signal.value;
}

export const Platform = {
    OS: 'web', // mocked
    select: (obj: any) => obj.web
};
