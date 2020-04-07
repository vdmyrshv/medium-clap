import React, { 
    useState, 
    useLayoutEffect, 
    useCallback, 
    createContext,
    useContext, 
    useMemo,
    useEffect,
    useRef 
} from 'react'

import styles from './index.css'

import mojs from 'mo-js'

const initialState = {
  count: 0,
  countTotal: 267,
  isClicked: false,
}

/**
 * custom hook for animation
 */

const useClapAnimation = ({
  clapEl,
  countEl,
  clapTotalEl
}) => {
  //wrapping the useState hook's default value in an anonymous fn will invoke it lazily, only when it is called
  //in general, favor passing a fn reference as opposed to invoking a fnwithin useState
  const [animationTimeline, setAnimationTimeline] = useState(() => new mojs.Timeline());
  
  //only use useLayoutEffect if the DOM is being directly manipulated with refs and will be updated between rerender
  useLayoutEffect(() => {
    if(!clapEl || !countEl || !clapTotalEl){
      return;
    }
    const tlDuration = 300

    const scaleButton = new mojs.Html({
      el: clapEl,
      duration: tlDuration,
      scale: {1.3: 1},
      easing: mojs.easing.ease.out,
    });

    //burst is a diff type of animation
    const triangleBurst = new mojs.Burst({
      parent: clapEl,
      radius: { 50: 95},
      count: 5,
      angle: 30,
      //children prop styles the actual particles
      children: {
        shape: 'polygon',
        radius: {6:0},
        stroke: 'rgba(211, 54, 0, 0.5)',
        strokeWidth: 2,
        angle: 210,
        delay: 30, 
        speed: 0.2,
        duration: tlDuration,
        easing: mojs.easing.bezier(0.1, 1, 0.3 , 1)
      }
    })

    const circleBurst = new mojs.Burst({
      parent: clapEl,
      radius: {50:75},
      angle: 25,
      children: {
        shape: 'circle',
        fill: 'rgba(149, 165, 166, 0.5)',
        delay: 30,
        speed: 0.2,
        duration: tlDuration, 
        radius: {3:0}
      }
    })

    const countAnimation = new mojs.Html({
      el: countEl,
      opacity: {0:1},
      delay: (3*tlDuration)/3,
      duration: tlDuration,
      y: { 0:-30 }
    }).then({
      opacity: {1:0},
      y: -80,
      delay: tlDuration/2
    });

    const countTotalAnimation = new mojs.Html({
      el: clapTotalEl,
      opacity: {0: 1},
      delay: (3*tlDuration)/2,
      duration: tlDuration,
      y: { 0:-3 }
    });

    if (typeof clapEl === 'string') {
      const clap = document.getElementById('clap');
      clap.style.transform = 'scale(1,1)';

    } else {
      clapEl.style.transform = 'scale(1,1)';
    }

    const newAnimationTimeline = animationTimeline.add([
      scaleButton, 
      countTotalAnimation, 
      countAnimation, 
      triangleBurst,
      circleBurst
    ]);

    setAnimationTimeline(newAnimationTimeline);
    
  }, [clapEl, countEl, clapTotalEl])

  return animationTimeline;
}

const MediumClapContext = createContext();
const {Provider} = MediumClapContext;

const MediumClap = ({children, onClap}) => {

    const MAXIMUM_USER_CLAP = 50;

    const [clapState, setClapState] = useState(initialState);
    const [{clapRef, clapCountRef, clapTotalRef}, setRefState] = useState({});

    const {count} = clapState;
    
    const animationTimeline = useClapAnimation({
        clapEl: clapRef,
        countEl: clapCountRef,
        clapTotalEl: clapTotalRef
    });

    const setRef = useCallback(node => {
            //save the node somewhere
            setRefState(prevRefState => ({
            ...prevRefState,
            [node.dataset.refkey]:node
            }))
    }, [])
    
    //below is a design pattern for how to use a ref to get a useEffect hook to fire only after render
    //original useEffect hook is commented out below
    const componentJustMounted = useRef(true);
    
    useEffect(() => {
        if(!componentJustMounted.current){
            onClap && onClap(clapState)
        }
        componentJustMounted.current = false;
    }, [count])
    
    // useEffect(() => {
    //     console.log("%c i have been invoked", "background: darkcyan;")
    //     onClap && onClap(clapState)
    // }, [count])
    
    const handleClapClick = () => {
        animationTimeline.replay();
        setClapState(prevState => ({
            count: Math.min(prevState.count + 1, MAXIMUM_USER_CLAP),
            countTotal: prevState.count < MAXIMUM_USER_CLAP ? prevState.countTotal + 1 : prevState.countTotal,
            isClicked: true
        })) 
    }

    //we memoize the provider values before passing them in so that Porvider only re-renders when necessary
    const memoizedValue = useMemo(() => ({...clapState, setRef}), [clapState, setRef])

    return (
        <Provider value={memoizedValue} >
            <button ref={setRef} data-refkey="clapRef" onClick={handleClapClick} className={styles.clap}>
                {children}
            </button>
        </Provider>

  )
}

/**
 * subcomponents built here
 */

const ClapIcon = () => {

    const {isClicked} = useContext(MediumClapContext)
    return <span>
        <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100.08 125" 
        className={`${styles.icon} ${isClicked && styles.checked}`}
        >
        <path d="M77.7 12.88a8.1 8.1 0 012.27 4.05c.36-.27.75-.5 1.16-.7a5.04 5.04 0 00-8.12-5.8l-.22.21c1.85.18 3.57.93 4.91 2.24zM48.9 26.91c.4.89.68 1.93.78 3.06l16.48-16.93a8.12 8.12 0 012.15-1.54c1-1.93.7-4.37-.93-5.96a5.06 5.06 0 00-7.15.1l-15.5 15.93c2.31 2.27 3.09 3.03 4.16 5.34zM10.04 66.63a32.95 32.95 0 019.4-23.59L38 23.98c.72-2.03.5-4.08-.08-5.32-.84-1.82-1.31-2.27-3.55-4.45L13.5 35.65a30.07 30.07 0 00-2.26 39.29 33.29 33.29 0 01-1.2-8.31z"/>
        <path d="M21.68 45.2l20.87-21.43c2.23 2.18 2.7 2.63 3.55 4.45a7.5 7.5 0 01-1.61 8.05L32.64 48.51a1.2 1.2 0 001.72 1.67L68.4 15.21a5.06 5.06 0 117.25 7.05L50.98 47.58a1.2 1.2 0 00.04 1.7 1.2 1.2 0 001.69-.02l28.48-29.28a5.06 5.06 0 017.25 7.06L59.94 56.3a1.2 1.2 0 00.04 1.69 1.2 1.2 0 001.68-.02l24.66-25.33a5.06 5.06 0 117.25 7.05L68.9 65.02a1.2 1.2 0 00.03 1.69 1.2 1.2 0 001.69-.01l14.56-14.98a5.07 5.07 0 117.25 7.06L64.79 87.17a30.09 30.09 0 01-43.11-41.96"/>
        </svg>
    </span>
}

const ClapCount = () => {

    const {count, setRef} = useContext(MediumClapContext)

    return <span ref={setRef} data-refkey="clapCountRef" className={styles.count}>
        + {count}
    </span>
}

const TotalClap = () => {

    const {countTotal, setRef} = useContext(MediumClapContext)
    return <span ref={setRef} data-refkey="clapTotalRef" className={styles.total}>
        {countTotal}
    </span>
}

/**
 * THE FOLLOWING IS A WAY OF ATTACHING THE CHILD COMPONENTS TO THE PARENT MEDIUMCLAP COMPONENT
 * basically, references to the subcomponents are added to the original component for easier readability
 */

MediumClap.Icon = ClapIcon;
MediumClap.Count = ClapCount;
MediumClap.Total = TotalClap;


/**
 * Usage
 */

 const Usage = () => {

    const [count, setCount] = useState(0)
    //this handleclap callback `exposes` the MediumClap state to the parent component usage
    const handleClap = (clapState) => {
        setCount(clapState.count);
    }

    return (
        <div style={{width: '100%'}}> 
            <MediumClap onClap={handleClap}>
                {/* <ClapIcon />
                <ClapCount />
                <TotalClap /> */}
                {/* this is an alternative way of exporting */}
                <MediumClap.Icon />
                <MediumClap.Count />
                <MediumClap.Total />
            </MediumClap>
            <div>{!!count && `you have clapped ${count} times`}</div>
        </div>
    )
 }

export default Usage;