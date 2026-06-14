import ReactPlayer from 'react-player';

const VideoPlayer=(link)=>{
return(
    <>
    <ReactPlayer url={link} width={720} height={480}>
    </ReactPlayer>
    </>
)
}
export default VideoPlayer