import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Save, X } from "lucide-react";
import FileUpload from "./FileUpload";

interface VideoReview {
  id: string;
  thumbnail: string;
  videoUrl: string;
  testimonial: string;
  customerName: string;
}

interface VideoEditorProps {
  videos: VideoReview[];
  onSave: (videos: VideoReview[]) => void;
  onCancel: () => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ videos, onSave, onCancel }) => {
  const [videoList, setVideoList] = useState<VideoReview[]>(videos);

  const addVideo = () => {
    const newVideo: VideoReview = {
      id: Date.now().toString(),
      thumbnail: "",
      videoUrl: "",
      testimonial: "",
      customerName: "",
    };
    setVideoList([...videoList, newVideo]);
  };

  const removeVideo = (id: string) => {
    setVideoList(videoList.filter(video => video.id !== id));
  };

  const updateVideo = (id: string, field: keyof VideoReview, value: string) => {
    setVideoList(videoList.map(video => 
      video.id === id ? { ...video, [field]: value } : video
    ));
  };

  const handleSave = () => {
    onSave(videoList);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-primary">Edit Video Reviews</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {videoList.map((video, index) => (
            <Card key={video.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Video Review #{index + 1}</CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeVideo(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <FileUpload
                      label="Thumbnail"
                      value={video.thumbnail}
                      onChange={(value) => updateVideo(video.id, 'thumbnail', value)}
                      type="image"
                      placeholder="Enter thumbnail URL or upload image"
                    />
                  </div>
                  <div>
                    <FileUpload
                      label="Video"
                      value={video.videoUrl}
                      onChange={(value) => updateVideo(video.id, 'videoUrl', value)}
                      type="video"
                      placeholder="Enter video URL or upload video file"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`customerName-${video.id}`}>Customer Name</Label>
                  <Input
                    id={`customerName-${video.id}`}
                    value={video.customerName}
                    onChange={(e) => updateVideo(video.id, 'customerName', e.target.value)}
                    placeholder="Customer Name"
                  />
                </div>
                <div>
                  <Label htmlFor={`testimonial-${video.id}`}>Testimonial</Label>
                  <Textarea
                    id={`testimonial-${video.id}`}
                    value={video.testimonial}
                    onChange={(e) => updateVideo(video.id, 'testimonial', e.target.value)}
                    placeholder="Customer testimonial..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <Button onClick={addVideo} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add New Video Review
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor; 