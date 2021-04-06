import Taro, { Component,InnerAudioContext } from '@tarojs/taro'
import { View,Text } from '@tarojs/components'
import VoiceBox from '../VoiceBox/indexEx'
import './RecorderPlay.scss'

interface RecorderPlayProps {
    /**
     * 录音时长 单位：ms
     */
    duration:number;
    /**
     * 录音地址
     */
    path:string;
}

interface RecorderPlayState {
    audioContext: InnerAudioContext;
    start: boolean;
    pause: boolean;
    stop: boolean;
}

export default class RecorderPlay extends Component<RecorderPlayProps, RecorderPlayState> {
    static externalClasses = ['class-name']
    
    constructor(props) {
        super(props);
    }

    componentWillMount(){
        const audioContext = Taro.createInnerAudioContext();
        this.setState({
            audioContext
        });

        let _this = this;
        audioContext.onPlay(() => {
            _this.setState({
                start: true,
                pause: false,
                stop: false,
            });
        });

        audioContext.onStop(() => {
            _this.setState({
                stop: true,
                pause: false,
                start: false,
            });
        });
        audioContext.onEnded(() => {
            _this.setState({
                stop: true,
                pause: false,
                start: false,
            });
        });
        audioContext.onError(() => {
            _this.setState({
                stop: true,
                pause: false,
                start: false,
            });
        });
        audioContext.onPause(() => {
            _this.setState({
                pause: true,
                start: true,
                stop: false,
            });
        });
    }

    play(event){
       event.stopPropagation(); 
       const {audioContext,start,pause,stop} = this.state;
       const {path} = this.props;
        
       if(!audioContext){
         return;
       }

       if(start && !stop){
            //已经开始 但是没结束
            if(pause){
                //已暂停，继续播放
                audioContext.play(); 
            }else{
                //播放中，暂停
                audioContext.pause(); 
            }
       }else{
            //未开始、或者已经结束 开始播放
            audioContext.src = path;
            audioContext.autoplay =false;
            audioContext.play();
       }
    }

    render() {
        const {duration} = this.props;
        const { start, pause, stop } = this.state;

        let timesStr = (duration/1000).toFixed(1);
        let status = start && !pause && !stop; 

        return (
            <View className='recorderPlayComponent class-name' onClick={this.play.bind(this)}>
                <View>
                    <VoiceBox status={status} />
                </View>
              <Text className='voiceLength'>{timesStr}s</Text>
            </View>
        )
    }
}