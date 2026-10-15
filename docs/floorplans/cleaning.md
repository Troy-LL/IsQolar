# Floor image cleaning

RT1. The three tonight floors in `public/maps/` were cleaned from the photos in this folder. Pins use `x` and `y` on a 0 to 1 scale of these files. Nothing was redrawn, relabeled, or painted on.

The script is [scripts/clean-floorplan.py](../../scripts/clean-floorplan.py). It needs Python 3, Pillow, and OpenCV, installed locally. They are not in `package.json`.

Corners below are pixels of the photo after EXIF orientation, in order top-left, top-right, bottom-right, bottom-left. The script warps that border to a rectangle, so the frame stays outside the file.

## main-1f-lobby.jpg

Source: `IBM_7739.JPG`. Main Academic Building 1st floor directory, the stand-in for the ground lobby. Orientation tag 1. Oriented size 5712 by 4284.

Corners: `450.3,609.2` `5237.1,647.8` `5322.0,3681.6` `400.5,3747.3`

```bash
python3 scripts/clean-floorplan.py docs/floorplans/IBM_7739.JPG public/maps/main-1f-lobby.jpg 450.3,609.2 5237.1,647.8 5322.0,3681.6 400.5,3747.3
```

## main-4f.jpg

Source: `IBM_7741.JPG`. Orientation tag 6, so the oriented image is 4284 by 5712. This is the tilted sheet. The bottom of the frame is outside the photo, so the bottom corners sit on the sheet below the title and the signature, not on a frame edge.

East and West stay as they are in the photo. [catalog.md](catalog.md) says this plan is mirrored compared with the 2012 directories (East and West swapped). This clean does not flip it.

Corners: `133.2,425.8` `3979.1,294.6` `4202.4,5638.0` `133.5,5638.0`

```bash
python3 scripts/clean-floorplan.py docs/floorplans/IBM_7741.JPG public/maps/main-4f.jpg 133.2,425.8 3979.1,294.6 4202.4,5638.0 133.5,5638.0
```

## main-5f.jpg

Source: `IBM_7742.JPG`. Main Academic Building 5th floor directory. Orientation tag 1. Oriented size 5712 by 4284.

Corners: `523.2,479.9` `5653.9,475.5` `5387.8,3857.2` `397.9,3804.3`

```bash
python3 scripts/clean-floorplan.py docs/floorplans/IBM_7742.JPG public/maps/main-5f.jpg 523.2,479.9 5653.9,475.5 5387.8,3857.2 397.9,3804.3
```
