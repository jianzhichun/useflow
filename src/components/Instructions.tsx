export default function({ width }: any) {
    const [visible, setVisible] = useState(false);
    return <Flex vertical align='start'>
        <Button style={{padding:'0 4px'}} onClick={() => setVisible(old => !old)} size="small" type="link">
            说明书
        </Button>
        {visible && <Image width={width} src="./pose-detection-lib/blazepose.png" />}
    </Flex>
}