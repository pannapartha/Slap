import bpy,os,json
P=r'G:\Floor is Lava\Slap';bpy.ops.wm.open_mainfile(filepath=P+'/bopling/Bopling.blend');rig=bpy.data.objects['Bopling_Rig']
for t in rig.animation_data.nla_tracks:t.mute=True
before=set(bpy.data.objects);bpy.ops.import_scene.fbx(filepath=P+'/mixamo/Getting Up (5).fbx',automatic_bone_orientation=False,use_anim=True)
source=next(o for o in bpy.data.objects if o not in before and o.type=='ARMATURE');src=source.animation_data.action;start,end=src.frame_range;fps=bpy.context.scene.render.fps;duration=(end-start)/fps
act=bpy.data.actions.new('GetUp');rig.animation_data.action=act;rig.data.pose_position='POSE'
for b in rig.pose.bones:b.rotation_mode='QUATERNION';b.location=(0,0,0);b.scale=(1,1,1)
frames=round(duration*30)
for fc in src.fcurves:
 if not fc.data_path.endswith('.rotation_quaternion'):continue
 nf=act.fcurves.new(fc.data_path,index=fc.array_index)
 for i in range(frames+1):nf.keyframe_points.insert(i+1,fc.evaluate(start+(end-start)*i/max(1,frames)),options={'FAST'}).interpolation='LINEAR'
bpy.context.scene.render.fps=30;bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=P+'/game/public/animations/GetUp.glb',export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIVE_ACTIONS',export_frame_range=False,export_force_sampling=True,export_def_bones=False,export_yup=True)
json.dump({'source':'Getting Up (5).fbx','sourceFps':fps,'duration':duration,'bones':len(rig.data.bones),'frames':frames},open(P+'/game/evidence/get-up-import.json','w'),indent=2)
