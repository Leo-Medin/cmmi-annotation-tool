import { AnnotationDef } from '@/utils/appTypes';
import { useState } from 'react';
import { DeleteOutline, PencilOutline } from 'mdi-material-ui';
import { Menu, MenuItem, TextField } from '@mui/material';
import { organismClasses } from '@/utils/appConstants';

const AnnotationsList = ({ annotations, setAnnotations }: { annotations: AnnotationDef[], setAnnotations: React.Dispatch<React.SetStateAction<AnnotationDef[]>> }) => {
    const [anchorPoint, setAnchorPoint] = useState<null | HTMLElement>(null)
    const openMenu = Boolean(anchorPoint)
    const [menuSelectedIndex, setMenuSelectedIndex] = useState(0)
    const [editSelectedIndex, setEditSelectedIndex] = useState<number | undefined>()

    return (
      <div className='annotations-list'>
        <div className='annotations-title'>
            Annotations
        </div>

        {annotations.map(({ description, organismClass, color, selected }, index: number)=>(
          <div 
            key={index} 
            className='annotation' 
            style={{ borderWidth: selected? '5px': '' }}
            onClick={()=>{
              const tmpAnnotations = JSON.parse(JSON.stringify(annotations)); // deep clone
              tmpAnnotations.forEach((element: AnnotationDef) => {
                element.selected = false; // deselect everything
              });
              tmpAnnotations[index].selected = true;
              setAnnotations(tmpAnnotations)
            }}
          >
            <div className='annotation-top'>
              <div>#{index+1}</div>
              <div 
                className='annotation-class' 
                style={{ backgroundColor: color }}
                onClick={(event)=>{
                  event.stopPropagation();
                  setMenuSelectedIndex(index);
                  setAnchorPoint(event.currentTarget)
                }}
              >
                {organismClass}
              </div>
              <DeleteOutline 
                sx={{ cursor: 'pointer' }}
                onClick={(event)=>{
                  event.stopPropagation();
                  const tmpAnnotations = JSON.parse(JSON.stringify(annotations)); // deep clone
                  tmpAnnotations.splice(index, 1);
                  setAnnotations(tmpAnnotations)  
                }}
              />
            </div>

            <div className='annotation-bottom'>
              <PencilOutline 
                sx={{ cursor: 'pointer' }}
                onClick={(event)=>{
                  event.stopPropagation();
                  setEditSelectedIndex(index);
                }}
              />
              <div className='annotation-description'>{description}</div>

            </div>

            {editSelectedIndex === index &&
                    <TextField
                        // className='annotation-textfield'
                        // value={description}
                        defaultValue={description}
                        focused
                        InputProps={{
                            className: 'annotation-textfield'
                        }}
                        multiline
                        maxRows={3}
                        onBlur={(event)=>{
                            const tmpAnnotations = JSON.parse(JSON.stringify(annotations)); // deep clone
                            tmpAnnotations[editSelectedIndex].description = event.target.value;
                            setAnnotations(tmpAnnotations)      
                            setEditSelectedIndex(undefined)    
                        }}
                    />
            }

          </div>
        ))}

        <Menu
          id="submenu"
          anchorEl={anchorPoint}
          open={openMenu}
          onClose={() => { setAnchorPoint(null) }}
          MenuListProps={{
            'aria-labelledby': 'basic-button'
          }}
        //   sx={{
        //     mt: "1px", "& .MuiMenu-paper": 
        //       { backgroundColor: "rgba(0,0,0,0.7)", }, 
        //   }}
        >
          {organismClasses.map((item, index) => {

            return(
              <MenuItem
                key={index} 
                className='class-menu-item'
                onClick={() => { 
                  const tmpAnnotations = JSON.parse(JSON.stringify(annotations)); // deep clone
                  tmpAnnotations[menuSelectedIndex].organismClass = item.organismClass;
                  tmpAnnotations[menuSelectedIndex].color = item.color;
                  setAnnotations(tmpAnnotations)
                  setAnchorPoint(null) 
                }}
              >
                {item.organismClass}
              </MenuItem>
            )
          })
          }
        </Menu>

      </div>
    )
}

export default AnnotationsList;