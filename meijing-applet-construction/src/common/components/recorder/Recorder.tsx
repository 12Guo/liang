import Taro, { Component, Config, } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { rootSourceBaseUrl } from '../../utils/requests'
import './Recorder.scss'


interface RecorderProps {
    /**
     * 语音控件高度
     */
    height:number;
    /**
     * 是否展示
     */
    show:boolean;

    /**
     * 结束时调用，删除或者完成
     */
    onFinish: (path:string|undefined,duration:number) => void;
}

interface RecorderState {
    /**
     * 是否开启录音了
     */
    recorderStart: boolean;

    /**
     * 录音是否结束
     */
    recorderStop: boolean;

    /**
     * 录音时长, 单位 ms
     */
    duration: number;

    /**
     * 录音文件缓存地址
     */
    tempFilePath?:string;
}

export default class Recorder extends Component<RecorderProps, RecorderState> {

    config: Config = {
        navigationBarTitleText: '',
        navigationBarBackgroundColor: '#FFFFFF',
        navigationBarTextStyle: 'black',
        backgroundColor: '#FFFFFF',
    }

    constructor(props) {
        super(props)
        this.state = {
            recorderStart: false,
            recorderStop: false,
            duration: 0,
        }
    }

    async componentWillMount() {
    }

    componentDidMount() {
        let _this = this;
        Taro.getRecorderManager().onStart(function(){
            _this.setState({
                recorderStart: true,
            });
        });

        Taro.getRecorderManager().onPause(() => {
            _this.setState({
                recorderStop: true,
            });
        });

        Taro.getRecorderManager().onStop(function(res){
            const { tempFilePath } = res;
            _this.setState({
                recorderStop: true,
                tempFilePath: tempFilePath,
            });
        });

    }

    componentDidUpdate() {
        const {show} = this.props;
        if(!show){
            this.recoderPause();
        }
    }

    /**
     * 开始录音
     */
    recoderStart(){
        const {recorderStart} = this.state;

        if(recorderStart){
            return;
        }else{
            //开启录音
            const options = {
                duration: 60000,
                sampleRate: 44100,
                numberOfChannels: 1,
                encodeBitRate: 192000,
                format: 'mp3',
                frameSize: 50
            }
            Taro.getRecorderManager().start(options);

            //录音计时
            let _this = this;
            const timer:NodeJS.Timeout = setInterval(() => {
                const {duration,recorderStart,recorderStop} = _this.state;
                
                if(recorderStart){
                    if(recorderStop){
                        clearInterval(timer);
                    }else{
                        let timesNew = duration + 100;
                        _this.setState({
                            duration: timesNew,
                        });
                    }
                }
            }, 100);
        }
    }

    /**
     * /暂停录音
     */
    recoderPause(){
        const {recorderStart} = this.state;
        if(recorderStart){
            //终止录音
            Taro.getRecorderManager().stop();
        } 
    }

    /**
     * 录音完成
     */
    recoderFinish(){
        const {tempFilePath,duration} = this.state;
        const {onFinish} = this.props;

        //录音完成，展示出录音播放按钮
        this.setState({
            recorderStart: false,
            recorderStop: false,
            duration: 0,
            tempFilePath: undefined,
        },
        ()=>{
            onFinish(tempFilePath,duration);
        });
    }   

    /**
     * 删除当前录音，并重置录音状态
     */
    delRecoder(){
        this.setState({
            recorderStart: false,
            recorderStop: false,
            duration: 0,
            tempFilePath: undefined,
        });
    }
    
    recorderTouchMove(e){
        e.preventDefault();
        e.stopPropagation();
        return false;
    }


    render() {
        const {height,show} = this.props;
        const {recorderStart,recorderStop,duration} = this.state;
        let timesStr = (duration/1000).toFixed(1);

        //录音完成
        let recorderDone = recorderStart && recorderStop;
        //距离底部的距离
        let bottom = show ? 0: -height;

        return (
                <View className='recorderView' style={'bottom:'+bottom+'px;'} onTouchMove={this.recorderTouchMove.bind(this)}>
                    <View className='leftView'>
                        {
                            recorderDone &&  
                            <Text className='delButton' onClick={this.delRecoder.bind(this)}>删除</Text>
                        }
                    </View>
                    
                    <View className='recorder' style={'height: '+height+'px;'}>
                        {
                            recorderStart && 
                            <Text className='duration'>{timesStr}s</Text>
                        }
                        <Image className='button' onTouchStart={this.recoderStart.bind(this)} onTouchEnd={this.recoderPause.bind(this)}   src={recorderDone? `${rootSourceBaseUrl}/assets/common/richInput/recoder_done.png`:`${rootSourceBaseUrl}/assets/common/richInput/recoder_doing.png`}/>
                        {
                            !recorderStart && 
                            <Text className='text'>按住说话</Text>
                        }
                    </View>

                    <View className='rightView'>
                        {
                        recorderDone && 
                        <Text className='finishButton' onClick={this.recoderFinish.bind(this)}>完成</Text>
                        }
                    </View>
                    
                </View>
        )
    }
}