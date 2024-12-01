import { Box, Button } from "@mui/material";
import { ModeType, ShapeType } from '@/utils/appTypes';

// interface AnotherChildProps {
//     handleClickNew: () => void; // Accept handleClickNew as a prop
// }

const TopBar = ({ mode, setMode, shapeType, setShapeType, handleClickNew, handleClickImport, handleClickExport }: 
    { 
        mode: ModeType, 
        setMode: React.Dispatch<React.SetStateAction<ModeType>>, 
        shapeType: ShapeType, 
        setShapeType: React.Dispatch<React.SetStateAction<ShapeType>>,
        handleClickNew: () => void,
        handleClickImport: () => void,
        handleClickExport: () => void,
    }) => {
    return (
        <Box className='topbar'>
            <Button
                onClick={handleClickNew}
            >
                New
            </Button>
            <Button
                onClick={handleClickImport}
            >
                Import
            </Button>
            <Button
                onClick={handleClickExport}
            >
                Export
            </Button>
            <Button
                sx={{ color: mode === 'pan-zoom'? 'white': '' }}
                onClick={()=>{
                    setMode('pan-zoom')                    
                }}
            >
                Pan/Zoom
            </Button>
            <Button
                sx={{ color: (mode === 'draw' && shapeType === 'rectangle')? 'white': '' }}
                onClick={()=>{
                    setMode('draw')                    
                    setShapeType('rectangle')
                }}
            >
                Rectangle
            </Button>
            <Button
                sx={{ color: (mode === 'draw' && shapeType === 'circle')? 'white': '' }}
                onClick={()=>{
                    setMode('draw')                    
                    setShapeType('circle')
                }}
            >
                Circle
            </Button>
        </Box>
    )
}

export default TopBar;